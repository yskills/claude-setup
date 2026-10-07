"""Body map of a VRoid VRM 0 model: for every texel of the body texture, where it sits on the body.

The outfit painter (outfits.py) draws garments as shapes on the body in 3D (rest pose, metres) and needs, per texel,
the 3D position and the body part. Built by rasterising the body triangles in UV space.
"""
import numpy as np

from remix import accessor, bone_positions

# Body parts by the bone that weighs most on a vertex
PARTS = {'torso': 0, 'leg': 1, 'foot': 2, 'arm': 3, 'hand': 4, 'neck': 5}


def part_of(name):
    if 'Toe' in name or 'Foot' in name:
        return PARTS['foot']
    if 'Leg' in name:
        return PARTS['leg']
    if any(k in name for k in ('Thumb', 'Index', 'Middle', 'Ring', 'Little', 'Hand')):
        return PARTS['hand']
    if 'Arm' in name or 'Shoulder' in name:
        return PARTS['arm']
    if 'Neck' in name or 'Head' in name:
        return PARTS['neck']
    return PARTS['torso']


def body_map(j, buf, size):
    """Returns pos (H, W, 3) in metres (nan where no body), part (H, W) int8 (-1 = none) and the bones dict."""
    bones = bone_positions(j, buf)
    joint_part = np.zeros(len(j['skins'][0]['joints']), np.int8)
    for name, (k, _) in bones.items():
        joint_part[k] = part_of(name)
    H = W = size
    pos = np.full((H, W, 3), np.nan, np.float32)
    part = np.full((H, W), -1, np.int8)
    body = next(m for m in j['meshes'] if m['name'].startswith('Body'))
    for prim in body['primitives']:
        if 'Body_00_SKIN' not in j['materials'][prim['material']]['name']:
            continue
        p, _, _ = accessor(j, buf, prim['attributes']['POSITION'])
        uv, _, _ = accessor(j, buf, prim['attributes']['TEXCOORD_0'])
        jn, _, _ = accessor(j, buf, prim['attributes']['JOINTS_0'])
        wt, _, _ = accessor(j, buf, prim['attributes']['WEIGHTS_0'])
        vpart = joint_part[jn[np.arange(len(jn)), wt.argmax(1)].astype(int)]
        tris, _, _ = accessor(j, buf, prim['indices'])
        tris = tris.reshape(-1, 3).astype(int)
        px = uv * [W, H]
        for a, b, c in tris:
            A, B, C = px[a], px[b], px[c]
            x0, y0 = np.floor(np.minimum(np.minimum(A, B), C)).astype(int)
            x1, y1 = np.ceil(np.maximum(np.maximum(A, B), C)).astype(int)
            x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, W - 1), min(y1, H - 1)
            if x1 < x0 or y1 < y0:
                continue
            gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
            d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1])
            if abs(d) < 1e-12:
                continue
            l1 = ((B[1] - C[1]) * (gx - C[0]) + (C[0] - B[0]) * (gy - C[1])) / d
            l2 = ((C[1] - A[1]) * (gx - C[0]) + (A[0] - C[0]) * (gy - C[1])) / d
            l3 = 1 - l1 - l2
            pad = -1.5 / max(abs(d) ** 0.5, 1)  # grow a pixel so seams get covered
            inside = (l1 >= pad) & (l2 >= pad) & (l3 >= pad)
            if not inside.any():
                continue
            P = l1[..., None] * p[a] + l2[..., None] * p[b] + l3[..., None] * p[c]
            ys, xs = np.nonzero(inside)
            pos[y0 + ys, x0 + xs] = P[ys, xs]
            best = np.argmax(np.stack([l1, l2, l3]), 0)[ys, xs]
            part[y0 + ys, x0 + xs] = vpart[np.array([a, b, c])[best]]
    return pos, part, bones
