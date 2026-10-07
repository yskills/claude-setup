"""Paint outfits onto a remixed VRoid figure (VRM 0): bikinis, lingerie, tops, jeans, stockings, skirts.

Usage: python3 -I outfits.py <remixed.vrm> <out.vrm> '<outfit json>'
An outfit is {"label": "Strand", "layers": [{"g": "bikini_top", "color": "#ff8a3d", ...}, ...],
"dress": false | {"keep": "skirt", "color": "#..."}, "shoes": "#hex" | false}.
Garments are shapes on the body in 3D (rest pose, metres), so they fit every body the remix makes.
Content line: every outfit must cover chest and hips (cover() refuses one that does not); no nude texture is ever
written to a file.
"""
import io, json, sys
import numpy as np
from PIL import Image, ImageFilter

from remix import read_glb, write_glb, hex_rgb, tint, accessor
from bodymap import body_map, PARTS

EDGE = 0.0016  # metres of soft edge


def smooth(d):
    """Signed distance (negative inside) to coverage 0..1 with a soft edge."""
    return np.clip(0.5 - d / EDGE, 0, 1)


class Body:
    def __init__(self, pos, part, bones):
        self.pos, self.part = pos, part
        self.ok = part >= 0
        x, y, z = (np.nan_to_num(pos[..., i]) for i in range(3))
        self.x, self.y, self.z, self.ax = x, y, z, np.abs(x)
        b = lambda n: bones[n][1]
        torso = part == PARTS['torso']
        self.torso, self.leg, self.arm = torso, part == PARTS['leg'], part == PARTS['arm']
        self.neck = part == PARTS['neck']
        self.hip_y, self.neck_y = b('J_Bip_C_Hips')[1], b('J_Bip_C_Neck')[1]
        self.shoulder_y = b('J_Bip_L_UpperArm')[1]
        self.knee_y, self.ankle_y = b('J_Bip_L_LowerLeg')[1], b('J_Bip_L_Foot')[1]
        self.arm_x = abs(b('J_Bip_L_UpperArm')[0])
        self.elbow_x, self.wrist_x = abs(b('J_Bip_L_LowerArm')[0]), abs(b('J_Bip_L_Hand')[0])
        # bust apex per side: the front-most torso point near the bust bones
        by = b('J_Sec_L_Bust1')[1]
        band = torso & (np.abs(y - by) < 0.09)
        self.apex = {}
        for s in (-1, 1):
            m = band & (np.sign(x) == s) & (np.abs(x) > 0.02)
            k = np.argmin(np.where(m, z, 9))
            self.apex[s] = np.array([x.flat[k], y.flat[k], z.flat[k]])
        ax_, ay, az = self.apex[1]
        # underbust: below the apex, where the front comes back to within 25 % of the bust's depth
        col = torso & (np.abs(np.abs(x) - abs(ax_)) < 0.01) & (z < 0)
        ys = np.arange(ay, ay - 0.15, -0.004)
        ref = np.array([np.min(np.where(col & (np.abs(y - yy) < 0.003), z, 9)) for yy in ys])
        back = ref[-1]
        self.underbust = next((yy for yy, zz in zip(ys, ref) if zz > az + (back - az) * 0.75), ay - 0.08)
        mid = torso & (np.abs(x) < 0.006) & (z < 0)
        self.crotch_y = float(np.min(np.where(torso & (np.abs(x) < 0.02), y, 9)))
        self.waist_y = (self.underbust + self.hip_y) / 2
        self.front_z = lambda: z < np.interp(y, [0, 3], [-0.02, -0.02])
        self.bust_r = (back - az) * 1.0 + 0.04
        _ = mid


def capsule(B, a, b, r, front=None):
    """Distance to a segment a-b (x, y) minus r; front=True/False limits it to the front or back."""
    p = np.stack([B.x, B.y], -1)
    a, b = np.array(a), np.array(b)
    t = np.clip(((p - a) @ (b - a)) / max((b - a) @ (b - a), 1e-9), 0, 1)
    d = np.linalg.norm(p - (a + t[..., None] * (b - a)), axis=-1) - r
    if front is not None:
        d = np.where((B.z < 0.0) == front, d, 9)
    return d


def tri_dist(P, A, Bv, C):
    """Signed distance in 2D from points P (..., 2) to triangle ABC (negative inside)."""
    def seg(a, b):
        e = b - a
        t = np.clip(((P - a) @ e) / (e @ e), 0, 1)
        return np.linalg.norm(P - (a + t[..., None] * e), axis=-1)
    d = np.minimum(np.minimum(seg(A, Bv), seg(Bv, C)), seg(C, A))
    def side(a, b):
        return (b[0] - a[0]) * (P[..., 1] - a[1]) - (b[1] - a[1]) * (P[..., 0] - a[0])
    s1, s2, s3 = side(A, Bv), side(Bv, C), side(C, A)
    inside = ((s1 >= 0) & (s2 >= 0) & (s3 >= 0)) | ((s1 <= 0) & (s2 <= 0) & (s3 <= 0))
    return np.where(inside, -d, d)


# ---------- garments: each returns (coverage 0..1, mask of edge for trim) ----------

def g_bikini_top(B, o):
    P = np.stack([B.x, B.y], -1)
    d = np.full(B.x.shape, 9.0)
    h = o.get('height', 1.0)
    for s in (-1, 1):
        ax_, ay, _ = B.apex[s]
        w = o.get('width', 0.15)
        top = np.array([ax_ - s * 0.006, ay + 0.06 * h])
        bl, br = np.array([ax_ - w / 2, B.underbust]), np.array([ax_ + w / 2, B.underbust])
        t = tri_dist(P, top, bl, br)
        d = np.minimum(d, np.where(B.torso & (B.z < -0.02), t, 9))
        # halter string to the neck, then the neck ring
        d = np.minimum(d, capsule(B, top, [s * 0.045, B.neck_y - 0.03], 0.0035, front=True))
    d = np.minimum(d, np.where(B.torso | B.neck, np.abs(B.y - (B.neck_y - 0.03)) - 0.0035, 9) if False else d)
    # under band all around
    band = np.where(B.torso, np.abs(B.y - (B.underbust + 0.004)) - 0.004, 9)
    d = np.minimum(d, band)
    # halter strings meet behind the neck
    d = np.minimum(d, np.where((B.torso | B.neck) & (B.z > 0), np.abs(B.y - (B.neck_y - 0.035)) - 0.0035, 9))
    return smooth(d), d


def bottom_dist(B, o, top_y=None):
    """Briefs: top edge at top_y, leg openings cut high at the sides; back cut by o['back'] (0 full, 1 cheeky)."""
    top_y = B.hip_y + o.get('rise', -0.015) if top_y is None else top_y
    hw = o.get('hipw', 0.17)
    s = np.clip(B.ax / hw, 0, 1)
    cut = o.get('cut', 1.6)
    leg_front = B.crotch_y - 0.012 + (top_y - B.crotch_y) * s ** cut
    leg_back = B.crotch_y - 0.012 + (top_y - B.crotch_y) * s ** (cut * (1 - 0.6 * o.get('back', 0.4)))
    leg_back = np.where(B.ax < 0.02, B.crotch_y - 0.03, leg_back)
    low = np.where(B.z < 0, leg_front, leg_back - (1 - o.get('back', 0.4)) * 0.06)
    region = B.torso | (B.leg & (B.y > B.crotch_y - 0.08))
    d = np.maximum(B.y - top_y, low - B.y)
    return np.where(region, d, 9), top_y


def g_bikini_bottom(B, o):
    d, top_y = bottom_dist(B, o)
    # side ties: a string all around at the top edge
    d = np.minimum(d, np.where(B.torso, np.abs(B.y - top_y + 0.003) - 0.0035, 9))
    return smooth(d), d


def g_briefs(B, o):
    d, top_y = bottom_dist(B, o)
    d = np.minimum(d, np.where(B.torso, np.abs(B.y - top_y + 0.006) - 0.006, 9))
    return smooth(d), d


def g_bra(B, o):
    """Balconette: full lower cups, scalloped top edge, straps over the shoulders, band all around."""
    d = np.full(B.x.shape, 9.0)
    for s in (-1, 1):
        ax_, ay, az = B.apex[s]
        rx = o.get('width', 0.15) / 2
        u = (B.x - ax_) / rx
        top = ay + 0.035 * o.get('height', 1.0) - 0.03 * np.clip(-u * s, 0, 1) ** 1.2 * 1.6
        top = top + 0.003 * np.sin(B.x * 900) * o.get('scallop', 1)
        cup = np.maximum.reduce([B.y - top, B.underbust - B.y, np.abs(u) - 1])
        d = np.minimum(d, np.where(B.torso & (B.z < -0.015), cup, 9))
        # strap: from the outer cup top straight over the shoulder
        sx = ax_ + s * rx * 0.45
        d = np.minimum(d, np.where((B.torso | B.neck) & (B.y > ay), np.abs(B.x - sx) - 0.006, 9))
    d = np.minimum(d, np.where(B.torso, np.maximum(B.underbust - 0.022 - B.y, B.y - B.underbust - 0.002), 9))
    return smooth(d), d


def g_garter(B, o):
    """Garter belt at the waist with four straps down to the stockings."""
    top = B.waist_y - 0.01
    d = np.where(B.torso, np.maximum(B.y - top, top - 0.05 - B.y), 9)
    for sx in (-1, 1):
        for front in (True, False):
            leg = B.leg & (np.sign(B.x) == sx) & ((B.z < 0) == front)
            cx = sx * 0.085
            d = np.minimum(d, np.where((leg | B.torso) & (B.y < top - 0.03) & (B.y > o.get('to', 0.74)),
                                       np.abs(B.x - cx) - 0.004, 9))
    return smooth(d), d


def g_stockings(B, o):
    top = o.get('top', 0.74)
    d = np.where(B.leg | (B.part == PARTS['foot']), B.y - top, 9)
    return smooth(d), d


def g_top(B, o):
    """Fitted top: crop (hem under the bust) or long; neckline scoop/v/halter; sleeves none/short/long."""
    hem = {'crop': B.underbust - 0.025, 'long': B.hip_y + 0.01}[o.get('length', 'crop')]
    hem = hem + o.get('hem', 0)
    neck = o.get('neck', 'scoop')
    depth = o.get('depth', 0.10)
    nw = o.get('neckw', 0.09)
    base = B.neck_y - 0.02
    if neck == 'v':
        line = base - depth * np.clip(1 - B.ax / nw, 0, 1)
    else:
        line = base - depth * np.clip(1 - (B.ax / nw) ** 2, 0, 1)
    front_cut = np.where(B.z < 0, B.y - line, -9)
    back_cut = np.where(B.z >= 0, B.y - (base - 0.03), -9)
    d = np.where(B.torso | B.neck, np.maximum.reduce([hem - B.y, front_cut, back_cut]), 9)
    sleeve = o.get('sleeve', 'short')
    if sleeve != 'none':
        reach = {'short': B.arm_x + 0.13, 'elbow': B.elbow_x + 0.02, 'long': B.wrist_x - 0.005}[sleeve]
        d = np.minimum(d, np.where(B.arm, B.ax - reach, 9))
    else:
        d = np.where(B.ax > B.arm_x - 0.012, 9, d)
    return smooth(d), d


def g_pants(B, o):
    """Jeans or shorts: low-rise waist, legs down to o['to'] ('ankle', 'knee', 'short', or a height)."""
    to = o.get('to', 'ankle')
    to = {'ankle': B.ankle_y + 0.05, 'knee': B.knee_y - 0.02, 'short': B.crotch_y - 0.06}.get(to, to)
    top = B.hip_y + o.get('rise', 0.0)
    d = np.where(B.torso, np.maximum(B.y - top, B.crotch_y - 0.05 - B.y), 9)
    d = np.minimum(d, np.where(B.leg, np.maximum(B.y - top, to - B.y), 9))
    return smooth(d), d


def g_bodysuit(B, o):
    """One-piece: swimsuit or bodysuit, high-cut legs, open back to the waist, thin straps."""
    bd, top_y = bottom_dist(B, {**o, 'rise': 0.25})
    t, _ = g_top(B, {'length': 'long', 'neck': o.get('neck', 'scoop'), 'depth': o.get('depth', 0.16),
                     'neckw': o.get('neckw', 0.11), 'sleeve': 'none'})
    td = np.where(t > 0.5, -1.0, 1.0) * EDGE
    d = np.maximum(bd, np.where(B.torso | B.neck | B.leg, td, 9))
    d = np.where((B.z > 0) & (B.y > B.waist_y + 0.03) & B.torso, 9, d) if o.get('open_back', True) else d
    return smooth(d), d


GARMENTS = {
    'bikini_top': g_bikini_top, 'bikini_bottom': g_bikini_bottom, 'bra': g_bra, 'briefs': g_briefs,
    'garter': g_garter, 'stockings': g_stockings, 'top': g_top, 'pants': g_pants, 'bodysuit': g_bodysuit,
}


# ---------- patterns ----------

def noise(shape, seed, scale):
    rng = np.random.default_rng(seed)
    n = rng.random((shape[0] // scale + 2, shape[1] // scale + 2)).astype(np.float32)
    return np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize(shape[::-1], Image.BICUBIC), np.float32) / 255


def paint(B, o, cov, d, size):
    c1 = hex_rgb(o.get('color', '#ffffff'))
    rgb = np.broadcast_to(c1, cov.shape + (3,)).copy()
    alpha = cov * o.get('opacity', 1.0)
    pat = o.get('pattern')
    if pat == 'gradient':  # top colour to bottom colour over the garment's height
        ys = B.y[cov > 0.5]
        lo, hi = (ys.min(), ys.max()) if ys.size else (0, 1)
        t = np.clip((B.y - lo) / max(hi - lo, 1e-3), 0, 1)[..., None]
        rgb = hex_rgb(o['color2']) * (1 - t) + c1 * t
    elif pat == 'stripes':
        on = (np.sin(B.y * o.get('freq', 260)) > o.get('ratio', 0.0))[..., None]
        rgb = np.where(on, c1, hex_rgb(o['color2']))
    elif pat == 'dots' or pat == 'stars':
        ang = np.arctan2(B.x, -B.z)
        u, v = ang * o.get('freq', 9), B.y * o.get('freq', 9) * 6
        fu, fv = u - np.round(u), v - np.round(v)
        r = np.hypot(fu, fv)
        if pat == 'stars':
            th = np.arctan2(fv, fu)
            r = r / (0.55 + 0.45 * np.cos(5 * th) ** 2)
        on = (r < o.get('size', 0.22))[..., None]
        rgb = np.where(on, hex_rgb(o['color2']), c1)
    elif pat == 'lace':  # sheer net with solid floral motifs
        u, v = B.x * 700, B.y * 700 + np.where(B.z > 0, 100, 0)
        net = (np.abs(np.sin(u + v)) < 0.25) | (np.abs(np.sin(u - v)) < 0.25)
        fu, fv = (B.x * 55) % 1 - 0.5, (B.y * 55) % 1 - 0.5
        th = np.arctan2(fv, fu)
        petal = np.hypot(fu, fv) < 0.22 + 0.12 * np.cos(5 * th)
        solid = petal | net
        alpha = alpha * np.where(solid, 1.0, o.get('sheer', 0.45))
        rgb = rgb * np.where(petal, 1.0, 0.9)[..., None]
    elif pat == 'denim':
        tw = 0.88 + 0.12 * (np.sin((B.y * 3000 + B.ax * 3000)) > 0)
        n = noise(cov.shape, 7, 3) * 0.25 + noise(cov.shape, 9, 40) * 0.35
        rgb = rgb * (tw * (0.8 + n))[..., None]
    if o.get('sheer') and pat != 'lace':
        alpha = alpha * o['sheer']
    # soft fold shading toward the edges, and a trim line along the edge
    inner = np.clip(-d / 0.012, 0, 1)
    rgb = rgb * (0.88 + 0.12 * inner)[..., None]
    if o.get('trim'):
        t = (d < 0) & (d > -o.get('trim_w', 0.003))
        rgb = np.where(t[..., None], hex_rgb(o['trim']), rgb)
        alpha = np.where(t, np.maximum(alpha, cov), alpha)
    return rgb, alpha


def details(B, o, rgb, alpha):
    """Small extras drawn on top: buttons, belt, seams, bows."""
    for k in o.get('extras', []):
        if k == 'belt':
            top = B.hip_y + o.get('rise', 0.0)
            m = B.torso & (B.y < top) & (B.y > top - 0.025)
            rgb[m], alpha[m] = hex_rgb(o.get('belt', '#5b3a24')), 1
            buckle = m & (B.ax < 0.018) & (B.z < 0)
            rgb[buckle] = hex_rgb('#d8b46a')
        if k == 'seams':
            m = (alpha > 0.5) & B.leg & (np.abs(np.abs(B.x) - 0.09) < 0.0012)
            rgb[m] = rgb[m] * 0.7 + hex_rgb('#e0a14a') * 0.3
        if k == 'bow':
            for s in (0,):
                bow = (B.z < 0) & (np.hypot((B.x - s) * 1.0, (B.y - (B.underbust + 0.004)) * 1.6) < 0.011)
                rgb[bow], alpha[bow] = hex_rgb(o.get('bow', o.get('trim', '#ffffff'))), 1
        if k == 'buttons':
            m = (alpha > 0.5) & (B.z < 0) & B.torso & (np.hypot(B.x, (B.y * 28) % 1 - 0.5) < 0.006)
            rgb[m] = hex_rgb('#f4efe6')
    return rgb, alpha


def skin_only(img, B):
    """The body texture with painted underwear and stockings replaced by skin (never written to a file alone)."""
    a = np.asarray(img.convert('RGBA')).astype(np.float32)
    rgb = a[..., :3]
    ref = np.median(rgb[B.torso & (np.abs(B.y - B.waist_y) < 0.02) & (B.z < 0) & (B.ax < 0.05)], 0)
    dist = np.linalg.norm(rgb - ref, axis=-1)
    hue_ok = (rgb[..., 0] > rgb[..., 2] + 18)  # skin is warm; white and blue fabric is not
    keep = (dist < 60) & hue_ok & B.ok
    keep |= ~(B.torso | B.leg | (B.part == PARTS['foot']))  # only fix torso and legs
    out, w = rgb * keep[..., None], keep.astype(np.float32)
    fill = rgb.copy()
    for r in (2, 4, 8, 16, 32, 64):
        bo = np.stack([np.asarray(Image.fromarray(out[..., i]).filter(ImageFilter.BoxBlur(r))) for i in range(3)], -1)
        bw = np.asarray(Image.fromarray(w).filter(ImageFilter.BoxBlur(r)))
        est = bo / np.maximum(bw, 1e-4)[..., None]
        todo = ~keep & (bw > 0.02)
        fill = np.where((todo & (w < 0.5))[..., None], est, fill)
        out = np.where((todo & (w < 0.5))[..., None], est * np.maximum(bw, 0)[..., None], out)
        w = np.maximum(w, np.where(todo, bw, 0))
    a[..., :3] = np.where(keep[..., None], rgb, fill)
    return a


def cover(B, alpha):
    """Content line guard: chest and hips must be covered before any texture is written."""
    for s in (-1, 1):
        ax_, ay, _ = B.apex[s]
        m = B.torso & (np.hypot(B.x - ax_, B.y - ay) < 0.02) & (B.z < 0)
        if not m.any() or alpha[m].min() < 0.95:
            raise ValueError('outfit leaves the chest uncovered')
    m = B.torso & (B.ax < 0.02) & (np.abs(B.y - (B.crotch_y + 0.03)) < 0.02)
    if not m.any() or alpha[m].min() < 0.95:
        raise ValueError('outfit leaves the hips uncovered')


def opaque(o):
    return o.get('pattern') != 'lace' and not o.get('sheer')


def dress_up(src, dst, outfit, title=None):
    j, buf = read_glb(src)
    views = [bytes(buf[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]) for bv in j['bufferViews']]
    body_mat = next(i for i, m in enumerate(j['materials']) if 'Body_00_SKIN' in m['name'])
    tex = j['materials'][body_mat]['pbrMetallicRoughness']['baseColorTexture']['index']
    img_i = j['textures'][tex]['source']
    img = Image.open(io.BytesIO(views[j['images'][img_i]['bufferView']]))
    size = img.size[0]
    pos, part, bones = body_map(j, buf, size)
    B = Body(pos, part, bones)
    a = skin_only(img, B)
    solid = np.zeros(part.shape, np.float32)
    for o in outfit['layers']:
        cov, d = GARMENTS[o['g']](B, o)
        rgb, alpha = paint(B, o, cov, d, size)
        rgb, alpha = details(B, o, rgb, alpha)
        a[..., :3] = a[..., :3] * (1 - alpha[..., None]) + rgb * alpha[..., None]
        if opaque(o) or o.get('lining'):
            solid = np.maximum(solid, alpha if opaque(o) else cov)
    cover(B, solid)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    out = io.BytesIO()
    img.save(out, 'PNG', optimize=True)
    views[j['images'][img_i]['bufferView']] = out.getvalue()
    j['images'][img_i]['mimeType'] = 'image/png'
    # the sample's dress and shoes: drop, keep, recolour or keep only the skirt
    body = next(m for m in j['meshes'] if m['name'].startswith('Body'))
    keep = []
    for prim in body['primitives']:
        name = j['materials'][prim['material']]['name']
        if 'Onepice' in name and not outfit.get('dress'):
            continue
        if 'Shoes' in name and outfit.get('shoes') is False:
            continue
        keep.append(prim)
    body['primitives'] = keep
    for name, key in (('Shoes_01', 'shoes'), ('Onepiece_01', 'dress')):
        val = outfit.get(key)
        colour = val.get('color') if isinstance(val, dict) else val
        if isinstance(colour, str):
            im = next(m for m in j['images'] if m.get('name', '').startswith(f'F00_002_{name}'))
            t = tint(Image.open(io.BytesIO(views[im['bufferView']])), colour)
            o2 = io.BytesIO(); t.save(o2, 'PNG', optimize=True)
            views[im['bufferView']] = o2.getvalue(); im['mimeType'] = 'image/png'
    if title:
        j['extensions']['VRM']['meta']['title'] = title
    write_glb(dst, j, views)
    return img


if __name__ == '__main__':
    dress_up(sys.argv[1], sys.argv[2], json.loads(sys.argv[3]))
