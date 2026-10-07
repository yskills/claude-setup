#!/usr/bin/env bash
# Builds the ten roster figures into <out dir> (default ./out) from pixiv's free VRoid samples.
# Needs curl, unzip, python3 with numpy and Pillow. Source: https://opengameart.org/content/vroid-studio-cc0-models
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; out="${1:-$here/out}"; src="${TMPDIR:-/tmp}/vroid-samples"; mkdir -p "$src" "$out"
for b in e f g; do
  f="$src/AvatarSample_${b^^}.vrm"
  [ -f "$f" ] || { curl -sSfL -o "$src/$b.zip" "https://opengameart.org/sites/default/files/avatarsample_$b.zip"; unzip -oqj "$src/$b.zip" '*.vrm' -d "$src"; }
done
python3 -I - "$here" "$out" "$src" <<'PY'
import json, sys, importlib.util
here, out, src = sys.argv[1], sys.argv[2], sys.argv[3]
spec = importlib.util.spec_from_file_location('remix', f'{here}/remix.py'); remix = importlib.util.module_from_spec(spec); spec.loader.exec_module(remix)
r = json.load(open(f'{here}/roster.json', encoding='utf-8'))
for fig in r['figures']:
    recipe = {**r['body'], **fig.get('body', {}), **{k: fig[k] for k in ('hair', 'eyes', 'dress')}, 'title': fig['name']}
    import os; os.makedirs(f"{out}/{fig['id']}", exist_ok=True)
    remix.remix(f"{src}/AvatarSample_{fig['base'].upper()}.vrm", f"{out}/{fig['id']}/model.vrm", recipe)
    print(fig['id'])
PY
