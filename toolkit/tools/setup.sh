#!/bin/bash
# One-time setup for a fresh session. Usage: bash tools/setup.sh
set -e
cd "$(dirname "$0")/.."
pip install --break-system-packages -q kokoro-onnx soundfile scipy numpy pillow
mkdir -p ~/tts
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -f ~/tts/$f ] || curl -sSLf -o ~/tts/$f https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f
done
[ -d node_modules/playwright ] || npm i --no-save playwright@1.63.0 >/dev/null
which ffmpeg >/dev/null || echo "WARNING: ffmpeg missing"
echo "setup ok"
