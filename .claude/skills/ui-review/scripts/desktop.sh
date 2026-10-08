#!/usr/bin/env bash
# A thread's own screen: runs a command on a virtual display (Xvfb) and records it to WebM.
# Usage: desktop.sh <out.webm> <command...>   e.g. desktop.sh .shots/run.webm npx electron .
set -euo pipefail
out=$1; shift
disp=${DESKTOP_DISPLAY:-:99}
size=${DESKTOP_SIZE:-1280x800}
command -v Xvfb >/dev/null && command -v ffmpeg >/dev/null || { echo "needs Xvfb and ffmpeg (apt-get install -y xvfb ffmpeg)" >&2; exit 1; }
if ! xdpyinfo -display "$disp" >/dev/null 2>&1 && [ ! -e "/tmp/.X11-unix/X${disp#:}" ]; then
  Xvfb "$disp" -screen 0 "${size}x24" >/dev/null 2>&1 &
  sleep 1
fi
mkdir -p "$(dirname "$out")"
ffmpeg -y -loglevel error -f x11grab -video_size "$size" -framerate 10 -i "$disp" -c:v libvpx -b:v 1M "$out" &
rec=$!
status=0
DISPLAY=$disp "$@" || status=$?
sleep 1
kill -INT "$rec"; wait "$rec" || true
echo "recorded $out"
exit "$status"
