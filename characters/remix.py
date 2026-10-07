"""Remix a VRoid VRM 0 model: reshape the body by bone weights and recolour hair, eyes and outfit.

Usage: python3 -I remix.py <source.vrm> <out.vrm> '<recipe json>'
Recipe keys (all optional): bust, hips, waist, thighs, butt (0 = unchanged, 0.3 = a lot),
hair, eyes, dress (hex colours), title (the name written into the file's meta), max (texture px, default 1024).
Needs numpy and Pillow. Only the mesh is moved; the skeleton, expressions, spring bones and licence stay.
"""
import io, json, struct, sys
import numpy as np
from PIL import Image

FORWARD = np.array([0.0, 0.0, -1.0])  # VRM 0 models face -Z


def read_glb(path):
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    bl = struct.unpack('<I', b[20 + jl:24 + jl])[0]
    return j, bytearray(b[28 + jl:28 + jl + bl])


def write_glb(path, j, views):
    """views: list of bytes per bufferView, laid out again with 4-byte alignment."""
    out = bytearray()
    for i, data in enumerate(views):
        out += b'\0' * (-len(out) % 4)
        j['bufferViews'][i]['byteOffset'] = len(out)
        j['bufferViews'][i]['byteLength'] = len(data)
        out += data
    out += b'\0' * (-len(out) % 4)
    j['buffers'] = [{'byteLength': len(out)}]
    js = json.dumps(j, ensure_ascii=False, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    total = 12 + 8 + len(js) + 8 + len(out)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(out), 0x004E4942) + out)


CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
N = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def accessor(j, buf, i):
    a = j['accessors'][i]
    bv = j['bufferViews'][a['bufferView']]
    dt = np.dtype(CT[a['componentType']])
    n = N[a['type']]
    stride = bv.get('byteStride') or dt.itemsize * n
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    raw = np.frombuffer(buf, np.uint8, count=stride * (a['count'] - 1) + dt.itemsize * n, offset=start)
    rows = np.lib.stride_tricks.as_strided(raw, (a['count'], dt.itemsize * n), (stride, 1))
    return np.ascontiguousarray(rows).view(dt).reshape(a['count'], n).astype(np.float64 if dt == np.float32 else dt), start, stride


def put_positions(j, buf, i, pos):
    a = j['accessors'][i]
    _, start, stride = accessor(j, buf, i)
    for k, p in enumerate(pos.astype(np.float32)):
        buf[start + k * stride:start + k * stride + 12] = p.tobytes()
    a['min'] = pos.min(0).tolist()
    a['max'] = pos.max(0).tolist()


def bone_positions(j, buf):
    skin = j['skins'][0]
    ibm, _, _ = accessor(j, buf, skin['inverseBindMatrices'])
    pos = {}
    for k, node in enumerate(skin['joints']):
        m = np.linalg.inv(ibm[k].reshape(4, 4).T)  # glTF matrices are column-major
        pos[j['nodes'][node]['name']] = (k, m[:3, 3])
    return pos


def reshape(j, buf, r):
    bones = bone_positions(j, buf)
    idx = lambda *names: [bones[n][0] for n in names if n in bones]
    groups = {
        'L_bust': idx('J_Sec_L_Bust1', 'J_Sec_L_Bust2'), 'R_bust': idx('J_Sec_R_Bust1', 'J_Sec_R_Bust2'),
        'hips': idx('J_Bip_C_Hips'), 'waist': idx('J_Bip_C_Spine'),
        'L_thigh': idx('J_Bip_L_UpperLeg', 'J_Sec_L_UpperLeg'), 'R_thigh': idx('J_Bip_R_UpperLeg', 'J_Sec_R_UpperLeg'),
    }
    centre = {
        'L_bust': bones['J_Sec_L_Bust1'][1], 'R_bust': bones['J_Sec_R_Bust1'][1],
        'hips': bones['J_Bip_C_Hips'][1], 'waist': bones['J_Bip_C_Spine'][1],
        'L_thigh': bones['J_Bip_L_UpperLeg'][1], 'R_thigh': bones['J_Bip_R_UpperLeg'][1],
    }
    done = set()
    for mesh in j['meshes']:
        if not mesh['name'].startswith('Body'):
            continue
        for prim in mesh['primitives']:
            pi = prim['attributes']['POSITION']
            if pi in done:
                continue
            done.add(pi)
            p, _, _ = accessor(j, buf, pi)
            jn, _, _ = accessor(j, buf, prim['attributes']['JOINTS_0'])
            wt, _, _ = accessor(j, buf, prim['attributes']['WEIGHTS_0'])
            w = lambda g: sum(np.where(jn == b, wt, 0).sum(1) for b in groups[g]) if groups[g] else np.zeros(len(p))
            q = p.copy()
            for side in ('L_bust', 'R_bust'):
                s = w(side)[:, None] * r.get('bust', 0)
                d = p - centre[side]
                q += d * s * 1.6 + FORWARD * s * 0.05
            for side in ('L_thigh', 'R_thigh'):
                s = w(side) * r.get('thighs', 0)
                d = p - centre[side]
                q[:, 0] += d[:, 0] * s
                q[:, 2] += d[:, 2] * s
            hip = w('hips') * r.get('hips', 0)
            d = p - centre['hips']
            q[:, 0] += d[:, 0] * hip * 1.4
            back = np.clip(d[:, 2], 0, None)  # behind the hips bone: +Z
            q[:, 2] += back * hip + back * w('hips') * r.get('butt', 0) * 2.2
            pull = w('waist') * r.get('waist', 0)
            d = p - centre['waist']
            q[:, 0] -= d[:, 0] * pull
            q[:, 2] -= d[:, 2] * pull * 0.6
            put_positions(j, buf, pi, q)


def hex_rgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float64)


def tint(img, colour):
    """Recolour by brightness: dark parts go to a deep shade, mid to the colour, light to a soft highlight."""
    rgba = np.asarray(img.convert('RGBA')).astype(np.float64)
    lum = (rgba[..., :3] @ [0.299, 0.587, 0.114]) / 255
    mid = np.median(lum[rgba[..., 3] > 8]) if (rgba[..., 3] > 8).any() else 0.5
    t = np.clip((lum - mid) * 2.5 + 0.5, 0, 1)[..., None]  # stretched so a pale texture keeps its pattern
    c = hex_rgb(colour)
    dark, light = c * 0.35, c + (255 - c) * 0.55
    rgb = np.where(t < 0.5, dark + (c - dark) * (t / 0.5), c + (light - c) * ((t - 0.5) / 0.5))
    rgba[..., :3] = rgb
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')


TINTS = {  # image name prefix -> recipe key
    'F00_000_HairBack_00': 'hair', 'F00_000_Hair_00_01': 'hair', 'F00_000_Hair_00_02': 'hair',
    'F00_000_EyeIris_00': 'eyes', 'F00_002_Onepiece_01': 'dress',
}
MATS = {'HairBack_00_HAIR': 'hair', 'Hair_00_HAIR_01': 'hair', 'Hair_00_HAIR_02': 'hair', 'Onepice_01_CLOTH': 'dress'}


def remix(src, dst, r):
    j, buf = read_glb(src)
    reshape(j, buf, r)
    views = [bytes(buf[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]) for bv in j['bufferViews']]
    biggest = r.get('max', 1024)
    for im in j.get('images', []):
        img = Image.open(io.BytesIO(views[im['bufferView']]))
        key = TINTS.get(im.get('name', ''))
        changed = False
        if key and r.get(key):
            img, changed = tint(img, r[key]), True
        if max(img.size) > biggest:
            img.thumbnail((biggest, biggest), Image.LANCZOS)
            changed = True
        if changed:
            out = io.BytesIO()
            img.save(out, 'PNG', optimize=True)
            views[im['bufferView']] = out.getvalue()
            im['mimeType'] = 'image/png'
    vrm = j['extensions']['VRM']
    for m in vrm['materialProperties']:
        key = next((v for k, v in MATS.items() if k in m['name']), None)
        if key and r.get(key):
            m['vectorProperties']['_Color'] = [1, 1, 1, 1]
            m['vectorProperties']['_ShadeColor'] = [0.8, 0.78, 0.84, 1]
    for mat in j['materials']:
        key = next((v for k, v in MATS.items() if k in mat['name']), None)
        if key and r.get(key):
            mat.setdefault('pbrMetallicRoughness', {})['baseColorFactor'] = [1, 1, 1, 1]
    if r.get('title'):
        vrm['meta']['title'] = r['title']
    write_glb(dst, j, views)


if __name__ == '__main__':
    remix(sys.argv[1], sys.argv[2], json.loads(sys.argv[3]))
