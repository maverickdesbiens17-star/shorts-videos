import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("/root/tts/kokoro-v1.0.onnx", "/root/tts/voices-v1.0.bin")
voice, speed = sys.argv[1], float(sys.argv[2])
lines = [l.rsplit("|",1) for l in open("script.txt").read().strip().split("\n")]
sr = 24000; out = [np.zeros(int(0.15*sr), np.float32)]; t = 0.15; segs = []
for text, pause in lines:
    a, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    a = a.astype(np.float32)
    # trim leading/trailing silence
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0,idx[0]-240): idx[-1]+480]
    segs.append({"text": text, "start": round(t,3), "end": round(t+len(a)/sr,3)})
    out += [a, np.zeros(int(float(pause)*sr), np.float32)]; t += len(a)/sr + float(pause)
y = np.concatenate(out); y = y/np.abs(y).max()*0.89
sf.write("voice.wav", y, sr); json.dump(segs, open("segments.json","w"), indent=1)
print("duration", round(len(y)/sr,2))
