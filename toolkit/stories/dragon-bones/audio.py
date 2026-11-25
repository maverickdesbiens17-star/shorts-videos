"""Original synthesized score + SFX for the dragon-bones short: mysterious pentatonic plucks (guzheng-like, Karplus-Strong),
woodblock + soft frame drum, 84 bpm, A minor pentatonic. Music and SFX at 50 % of the voice (gated RMS)."""
import json, numpy as np, soundfile as sf
from scipy.signal import lfilter
SR = 48000
voice, vsr = sf.read("voice/voice.wav")
x = np.arange(len(voice) * 2) / 2.0
voice = np.interp(x, np.arange(len(voice)), voice)
N = len(voice); rng = np.random.default_rng(11)

def env(n, a=0.005, r=0.2):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    e *= np.exp(-np.arange(n) / (r * SR)); return e
def place(buf, sig, at, gain=1.0):
    i = int(at * SR); j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf): buf[i:j] += gain * sig[: j - i]
def tone(f, dur): return np.sin(2 * np.pi * f * np.arange(int(dur * SR)) / SR)
def lp(sig, k=0.1): return lfilter([k], [1, -(1 - k)], sig)
def noise(dur): return rng.standard_normal(int(dur * SR))
mid = lambda n: 440 * 2 ** ((n - 69) / 12)
def pluck(f, dur=1.6, bright=0.5):
    n = int(dur * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = 0.996 * (bright * buf[i % p] + (1 - bright) * buf[(i + 1) % p]) if i % p else 0.996 * 0.5 * (buf[0] + buf[1])
    return out * env(n, 0.001, dur * 0.5)
cache = {}
def pl(n, dur=1.4):
    k = (n, dur)
    if k not in cache: cache[k] = pluck(mid(n), dur)
    return cache[k]

# ---------------- music ----------------
X_AT = 41.6          # legend crossed out: music stops for a beat
music = np.zeros(N); beat = 60 / 84
wood = lambda: lp(tone(1250, 0.06) + 0.3 * noise(0.06), 0.6) * env(int(0.06 * SR), 0.0005, 0.012)
drum = lambda: (tone(70, 0.35) + 0.3 * lp(noise(0.35), 0.05)) * env(int(0.35 * SR), 0.002, 0.11)
penta = [57, 60, 62, 64, 67, 69, 72, 74, 76]   # A C D E G A C D E
mel = [5, None, 4, 3, 2, None, 3, None, 5, 6, 5, None, 4, None, None, None,
       7, None, 6, 5, 4, None, 5, 3, 2, None, 3, None, 1, None, None, None]
bass = [45, 45, 43, 43, 41, 41, 40, 43]
b = 0; tb = 0.0
while tb < N / SR:
    if not (X_AT - 0.05 <= tb < X_AT + 0.75):
        lvl = 0.75 if tb < 3.4 else 1.0
        if b % 2 == 0: place(music, wood(), tb, 0.35 * lvl)
        place(music, wood(), tb + beat / 2, 0.18 * lvl)
        if b % 4 == 0: place(music, drum(), tb, 0.8 * lvl)
        if b % 2 == 0: place(music, lp(pl(bass[(b // 2) % 8], 2.2), 0.2), tb, 0.6 * lvl)
        m = mel[b % 32]
        if m is not None and tb > 3.4: place(music, pl(penta[m]), tb, 0.45 * lvl)
        if b % 8 == 6 and tb > 3.4: place(music, pl(penta[min(8, (m or 4) + 2)], 1.0), tb + beat / 2, 0.2 * lvl)
    tb += beat; b += 1
# airy drone pad (fifths) for mystery
pad = (tone(mid(45), N / SR) + 0.6 * tone(mid(52), N / SR) + 0.3 * tone(mid(57), N / SR)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.1 * np.arange(N) / SR))
pad = lp(pad, 0.03); pad[int((X_AT - 0.05) * SR): int((X_AT + 0.75) * SR)] *= 0.1
music += 0.35 * pad
fade = np.ones(N); nf = int(1.2 * SR); fade[-nf:] = np.linspace(1, 0, nf); music *= fade

# ---------------- SFX ----------------
sfx = np.zeros(N)
def whoosh(d=0.4):
    n = noise(d); e = np.sin(np.linspace(0, np.pi, len(n))) ** 2; return lp(n, 0.06) * e * 3
def ting(f0=1568):
    s = sum(tone(f, 1.2) * a for f, a in [(f0, 1), (f0 * 1.5, 0.5), (f0 * 2, 0.3)]); return s * env(len(s), 0.001, 0.35)
def thunk(): s = tone(90, 0.3) + lp(noise(0.3), 0.3) * 0.5; return s * env(len(s), 0.001, 0.07)
def pop(f=600): return tone(f, 0.12) * np.linspace(1, 0, int(0.12 * SR)) ** 2
def gulp(): k = int(0.25 * SR); f = np.linspace(500, 180, k); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(k, 0.005, 0.1)
def gong(): s = sum(tone(f, 3.0) * a for f, a in [(110, 1), (164, 0.6), (237, 0.4), (331, 0.25)]); return lp(s, 0.4) * env(len(s), 0.004, 1.1)
def rasp(d=0.8, rate=10):
    n = lp(noise(d), 0.35); gate = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * rate * np.arange(len(n)) / SR)); return n * gate * env(len(n), 0.02, d)
def crack(): n = noise(0.25); return (lp(n, 0.9) * env(len(n), 0.0005, 0.03) + 0.6 * lp(noise(0.25), 0.2) * env(int(0.25 * SR), 0.001, 0.08))
def fire(d=1.2): n = lp(noise(d), 0.08) * (1 + 0.5 * (rng.random(int(d * SR)) > 0.995)); e = np.minimum(1, np.arange(len(n)) / (0.1 * SR)) * np.exp(-np.arange(len(n)) / (0.8 * SR)); return n * e * 2.5
def buzz(d=1.6): tt = np.arange(int(d * SR)) / SR; f = 560 + 40 * np.sin(2 * np.pi * 3 * tt); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)); return lp(s, 0.3) * np.sin(np.pi * tt / d) * 0.6
def clink(): return ting(2600) * 0.7
def chomp(): s = lp(noise(0.18), 0.5) + tone(120, 0.18); return s * env(len(s), 0.001, 0.05)
def stamp(): return thunk()
def scratch(): k = int(0.3 * SR); return lp(noise(0.3), 0.7) * env(k, 0.002, 0.08) * 0.8
def rain(d=0.9): n = noise(d) * (rng.random(int(d * SR)) > 0.97); return lp(n, 0.6) * 2
def charge(d=0.8): n = sum(lp(noise(d), 0.08 + 0.04 * i) for i in range(3)); return n * np.sin(np.linspace(0, np.pi, len(n)))

CUTS = [1.45, 3.45, 5.15, 5.6, 7.45, 9.08, 9.85, 10.9, 12.45, 13.85, 16.5, 19.0, 20.55, 21.85, 23.45, 25.45, 26.45, 27.72, 28.82, 29.78, 30.62, 31.4, 32.6, 34.22, 36.5, 38.15, 39.85, 42.15, 43.35, 44.85, 48.35, 50.3, 51.65, 52.5, 54.15, 55.1, 57.2, 59.35, 60.95, 62.95]
for s in CUTS: place(sfx, whoosh(0.35), s - 0.15, 0.25)
place(sfx, ting(1800), 1.0, 0.3)                                   # ? pops
place(sfx, gulp(), 2.5, 0.9)                                       # swallow history
place(sfx, stamp(), 3.6, 0.7)                                      # CENTURIES seal
for i in range(4): place(sfx, thunk(), 3.7 + i * 0.5, 0.5)          # hoes
place(sfx, pop(), 5.25, 0.8)                                       # map pin
place(sfx, thunk(), 5.9, 0.8); place(sfx, ting(), 6.3, 0.45)        # bone pulled out + sparkle
place(sfx, stamp(), 7.7, 0.6)                                      # MEDICINE SHOP
place(sfx, ting(1320), 9.1, 0.5); place(sfx, stamp(), 9.15, 0.6)    # DRAGON BONES
place(sfx, rasp(1.0, 9), 9.9, 0.9)                                 # grinding
place(sfx, gulp(), 11.5, 1.0)                                      # GULP
place(sfx, pop(900), 13.3, 0.6)                                    # SCRATCHES?
place(sfx, rasp(1.6, 14), 14.4, 0.8)                               # scraping
place(sfx, gong(), 16.5, 0.9)                                      # 1899
place(sfx, pop(), 18.6, 0.6)                                       # BEIJING
place(sfx, pop(), 19.9, 0.6)                                       # WANG YIRONG
place(sfx, ting(), 21.2, 0.5)                                      # looked closer
place(sfx, gong(), 21.85, 0.5); place(sfx, ting(2000), 23.0, 0.5)   # writing!
for i in range(6): place(sfx, pop(1200 + i * 120), 23.75 + i * 0.15, 0.35)   # counter
place(sfx, gong(), 25.5, 0.6)                                      # Shang kings
for i in range(4): place(sfx, scratch(), 26.6 + i * 0.3, 0.6)       # carving
place(sfx, pop(), 27.85, 0.5); place(sfx, pop(), 28.95, 0.5)        # tags
place(sfx, rain(0.9), 29.8, 0.8)
place(sfx, charge(0.8), 30.65, 0.7)
place(sfx, whoosh(0.8), 31.5, 0.3)                                 # ghost
place(sfx, pop(300), 33.3, 0.6)                                    # toothache throb
place(sfx, fire(1.4), 35.45, 0.9)                                  # fire into the bone
place(sfx, crack(), 36.6, 1.0); place(sfx, crack(), 36.95, 0.8)     # cracks
place(sfx, stamp(), 37.3, 0.6)
place(sfx, stamp(), 38.3, 0.6)                                     # THE LEGEND
place(sfx, buzz(1.6), 39.9, 0.5)                                   # mosquito
place(sfx, scratch(), 41.65, 1.0); place(sfx, scratch(), 41.85, 1.0)   # red X
place(sfx, stamp(), 42.2, 0.6)                                     # MORE LIKELY
for i in range(5): place(sfx, clink(), 43.4 + i * 0.12, 0.5)        # coins
for i in range(8): place(sfx, thunk(), 45.0 + i * 0.4, 0.35)        # digging
for i in range(10): place(sfx, pop(1000 + i * 90), 45.65 + i * 0.13, 0.3)  # counter
for i in range(6): place(sfx, pop(700), 48.4 + i * 0.12, 0.45)      # symbols pop in
place(sfx, ting(), 50.65, 0.5)                                     # morph
place(sfx, ting(2200), 51.7, 0.35)
place(sfx, stamp(), 52.9, 0.6)                                     # OLDEST LIBRARY
place(sfx, chomp(), 54.55, 1.0)
for i in range(11): place(sfx, ting(2400), 55.1 + i / 6, 0.22)       # spoonfuls
place(sfx, ting(1500), 57.5, 0.4)                                  # clue sparkle
place(sfx, thunk(), 60.05, 0.9); place(sfx, stamp(), 60.25, 0.5)    # bin + JUNK?
place(sfx, crack(), 61.8, 0.6)
place(sfx, pop(), 62.4, 0.5)
place(sfx, stamp(), 63.35, 0.6)                                    # COMMENT

# ---------------- mix ----------------
def grms(x, thr=-45):
    w = int(0.05 * SR); fr = x[: len(x) // w * w].reshape(-1, w); r = np.sqrt((fr ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(r); return np.sqrt((r[db > thr] ** 2).mean())
vr = grms(voice)
music *= 0.5 * vr / grms(music)
sfx *= 0.5 * vr / grms(sfx)
pk = np.abs(voice).max() * 0.7
sfx = np.clip(sfx, -pk, pk); sfx *= min(1.0, 0.5 * vr / grms(sfx))
mix = voice + music + sfx
print("music vs voice dB:", round(20 * np.log10(grms(music) / vr), 2), " sfx vs voice dB:", round(20 * np.log10(grms(sfx) / vr), 2))
mix /= max(1.0, np.abs(mix).max() / 0.95)
sf.write("mix.wav", mix.astype(np.float32), SR)
print("len", N / SR)
