"""Original synthesized score + SFX for the rhino-vote short (São Paulo 1959): light bossa-nova comping (nylon-guitar plucks via
Karplus-Strong), walking-ish bass, shaker + rim-click clave, soft vibraphone melody, 132 bpm, F major ii-V-I.
Tape-stop + rewind chirps on "Let's rewind". Music and SFX at 50 % of the voice (gated RMS)."""
import json, numpy as np, soundfile as sf
from scipy.signal import lfilter
SR = 48000
voice, vsr = sf.read("voice/voice.wav")
x = np.arange(len(voice) * 2) / 2.0
voice = np.interp(x, np.arange(len(voice)), voice)
N = len(voice); rng = np.random.default_rng(24)
STARTS = json.load(open("starts.json"))

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
def pluck(f, dur=1.2, bright=0.35):
    n = int(dur * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        j = i % p; out[i] = buf[j]; buf[j] = 0.995 * (bright * buf[j] + (1 - bright) * buf[(j + 1) % p])
    return lp(out, 0.5) * env(n, 0.002, dur * 0.45)
cache = {}
def pl(n, dur=1.0):
    k = (n, dur)
    if k not in cache: cache[k] = pluck(mid(n), dur)
    return cache[k]
def chord(notes, dur=0.9): return sum(pl(n, dur) for n in notes) / len(notes)
def vib(n, dur=0.8):
    t = np.arange(int(dur * SR)) / SR; f = mid(n)
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 8)) * env(len(t), 0.003, 0.35) * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * t))

# ---------------- music ----------------
REW0, REW1 = 9.62, 10.9        # "Let's rewind": tape-stop, then silence until the story starts
music = np.zeros(N); e8 = 60 / 132 / 2
prog = [([55, 58, 62, 65], 43), ([55, 58, 60, 64], 36), ([57, 60, 64, 65], 41), ([57, 60, 64, 65], 41),
        ([57, 60, 64, 67], 45), ([54, 57, 60, 62], 38), ([55, 58, 62, 65], 43), ([55, 58, 60, 64], 36)]   # Gm7 C7 Fmaj7 Fmaj7 Am7 D7 Gm7 C7
comp = [0, 3, 6, 10, 13]               # bossa guitar pattern over 2 bars (16 eighths)
clave = [0, 3, 6, 10, 12]
mel = {0: 72, 3: 74, 6: 76, 8: 77, 10: 76, 14: 72, 16: 69, 19: 72, 22: 74, 26: 72, 28: 70, 30: 69}
shaker = lambda: lp(noise(0.05), 0.5) * env(int(0.05 * SR), 0.004, 0.015)
rim = lambda: lp(tone(1700, 0.04) + 0.5 * noise(0.04), 0.7) * env(int(0.04 * SR), 0.0005, 0.008)
kick = lambda: tone(55, 0.25) * env(int(0.25 * SR), 0.002, 0.08)
i8 = 0; t = 0.0
while t < N / SR:
    bar2 = (i8 // 16) % 4; pos = i8 % 16; ch_, root = prog[(i8 // 8) % 8]
    if not (REW0 <= t < REW1):
        lvl = 0.8 if t < 3.8 else 1.0
        place(music, shaker(), t, 0.10 * lvl * (1.3 if i8 % 2 else 0.8))
        if pos in clave: place(music, rim(), t, 0.22 * lvl)
        if pos % 8 in (0,): place(music, kick(), t, 0.5 * lvl)
        if pos in comp: place(music, chord(ch_, 0.7), t, 0.55 * lvl)
        if pos % 8 == 0: place(music, lp(pl(root, 1.0), 0.25), t, 0.9 * lvl)
        if pos % 8 == 3: place(music, lp(pl(root + 7, 0.6), 0.25), t + e8, 0.7 * lvl)
        m = mel.get(i8 % 32)
        if m and t > 3.8: place(music, vib(m), t, 0.22 * lvl)
    i8 += 1; t += e8
# tape-stop: the last half second before the rewind slows down and drops in pitch
a, b = int((REW0 - 0.5) * SR), int(REW0 * SR)
seg = music[a:b].copy(); k = np.linspace(0, 1, len(seg)); idx = np.cumsum(1 - 0.85 * k); idx = idx / idx[-1] * (len(seg) - 1) * 0.6
music[a:b] = np.interp(idx, np.arange(len(seg)), seg) * (1 - k)
fade = np.ones(N); nf = int(1.0 * SR); fade[-nf:] = np.linspace(1, 0, nf); music *= fade

# ---------------- SFX ----------------
sfx = np.zeros(N)
def whoosh(d=0.4):
    n = noise(d); e = np.sin(np.linspace(0, np.pi, len(n))) ** 2; return lp(n, 0.06) * e * 3
def ting(f0=1568):
    s = sum(tone(f, 1.2) * a for f, a in [(f0, 1), (f0 * 1.5, 0.5), (f0 * 2, 0.3)]); return s * env(len(s), 0.001, 0.35)
def thunk(): s = tone(90, 0.3) + lp(noise(0.3), 0.3) * 0.5; return s * env(len(s), 0.001, 0.07)
def pop(f=600): return tone(f, 0.12) * np.linspace(1, 0, int(0.12 * SR)) ** 2
def sweep(f0, f1, d, wave=np.sin):
    k = int(d * SR); f = np.linspace(f0, f1, k); return wave(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.linspace(0, np.pi, k))
def drumroll(d): n = noise(d) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * np.arange(int(d * SR)) / SR)); return lp(n, 0.25) * np.linspace(0.3, 1, len(n))
def crash(): return lp(noise(1.6), 0.7) * env(int(1.6 * SR), 0.001, 0.5)
def fanfare():
    out = np.zeros(int(1.4 * SR))
    for i, (n, d) in enumerate([(65, 0.15), (69, 0.15), (72, 0.15), (77, 0.9)]):
        tt = np.arange(int(d * SR)) / SR; f = mid(n); s = np.sign(np.sin(2 * np.pi * f * tt)) * 0.4 + np.sin(2 * np.pi * f * tt)
        place(out, lp(s, 0.2) * env(len(tt), 0.01, d), [0, 0.15, 0.3, 0.45][i])
    return out
def cheer(d=1.6):
    n = sum(lp(noise(d), 0.05 + 0.03 * i) * (1 + 0.5 * np.sin(2 * np.pi * (3 + i) * np.arange(int(d * SR)) / SR)) for i in range(4))
    return n * np.minimum(1, np.arange(len(n)) / (0.15 * SR)) * np.exp(-np.arange(len(n)) / (0.9 * SR)) * 1.5
def splash(): n = lp(noise(0.6), 0.35); return n * env(len(n), 0.002, 0.18) * 1.5
def gush(d=1.0): n = lp(noise(d), 0.15); return n * np.sin(np.linspace(0, np.pi, len(n))) * 2
def bell(): return ting(1320) + 0.6 * ting(1980)
def typer(): return lp(noise(0.03), 0.8) * env(int(0.03 * SR), 0.0005, 0.006)
def heehaw():
    out = np.zeros(int(1.2 * SR))
    for i, (f0, f1) in enumerate([(900, 600), (300, 260), (900, 600), (300, 260)]):
        k = int(0.28 * SR); f = np.linspace(f0, f1, k); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.linspace(0, np.pi, k))
        place(out, lp(s, 0.3), i * 0.29)
    return out
def buzzer(): return lp(np.sign(np.sin(2 * np.pi * 110 * np.arange(int(0.4 * SR)) / SR)), 0.2) * env(int(0.4 * SR), 0.005, 0.3)
def wahwah():
    out = np.zeros(int(2.2 * SR))
    for i, n in enumerate([58, 57, 56, 55]):
        d = 0.45 if i < 3 else 1.0; tt = np.arange(int(d * SR)) / SR; f = mid(n) * (1 + (0.02 * np.sin(2 * np.pi * 6 * tt) if i == 3 else 0))
        s = lp(np.sign(np.sin(2 * np.pi * np.cumsum(np.full(len(tt), 1.0) * f) / SR)), 0.12) * np.sin(np.linspace(0, np.pi, len(tt)))
        place(out, s, i * 0.45)
    return out
def rewind(d=1.1):
    out = np.zeros(int(d * SR))
    for i in range(14): place(out, sweep(2400, 900, 0.07), i * d / 14, 0.6)
    return out + 0.3 * lp(noise(d), 0.3) * np.sin(np.linspace(0, np.pi, int(d * SR)))
def flip(): return lp(noise(0.12), 0.4) * env(int(0.12 * SR), 0.002, 0.04)
def chime(): return sum(ting(f) * 0.4 for f in (2093, 2637, 3136))
def scribble(): return lp(noise(0.18), 0.6) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 22 * np.arange(int(0.18 * SR)) / SR))) * 0.6
def beep(): return np.sign(tone(440, 0.18)) * 0.3 * env(int(0.18 * SR), 0.005, 0.15)

for s in STARTS[1:]: place(sfx, whoosh(0.35), s - 0.15, 0.25)
place(sfx, whoosh(0.9), 0.0, 0.4); place(sfx, thunk(), 0.9, 0.7)            # spinning paper lands
place(sfx, bell(), 1.85, 0.35); place(sfx, bell(), 2.05, 0.3)                # tram bell
place(sfx, drumroll(1.45), 2.35, 0.6)                                         # top vote-getter...
place(sfx, crash(), 3.82, 0.6); place(sfx, fanfare(), 3.84, 0.7); place(sfx, cheer(1.6), 3.9, 0.7)
place(sfx, ting(2200), 5.9, 0.5)                                              # wink
for i in range(9): place(sfx, pop(900 + i * 60), 6.9 + i * 0.11, 0.3)        # counter
for i in range(3): place(sfx, thunk(), 8.1 + i * 0.6, 0.5)                    # ballots in the box
place(sfx, rewind(1.15), 9.7, 0.8)
place(sfx, bell(), 11.2, 0.3)
place(sfx, splash(), 11.98, 0.9)                                              # pothole
place(sfx, thunk(), 13.35, 0.8); place(sfx, gush(1.2), 13.4, 0.7)             # manhole geyser
for i in range(12): place(sfx, pop(700 + (i % 4) * 90), 15.0 + i * 0.15, 0.25)   # posters
for i in range(8): place(sfx, thunk(), 17.2 + i * 0.22, 0.25)                 # scramble steps
place(sfx, pop(), 18.25, 0.6)                                                 # 45 SEATS
for i in range(3): place(sfx, sweep(220, 180, 0.4, lambda p: np.sign(np.sin(p))) * 0.3, 19.8 + i * 0.2, 0.5)   # blah blah
place(sfx, thunk(), 20.45, 0.5)                                               # FED UP
for i in range(14): place(sfx, typer(), 22.0 + i * 0.09, 0.6)                 # typewriter
place(sfx, ting(1760), 23.27, 0.6)                                            # light bulb idea
place(sfx, chime(), 24.3, 0.5)                                                # star
place(sfx, pop(1100), 26.1, 0.5); place(sfx, sweep(400, 900, 0.25), 26.8, 0.5)  # 5 + bow boing
place(sfx, beep(), 28.3, 0.5); place(sfx, beep(), 28.55, 0.5)                 # truck horn
for i in range(8): place(sfx, thunk(), 29.3 + i * 0.27, 0.45)                 # printing press
place(sfx, flip(), 31.55, 0.8)                                                # ballot handed over
place(sfx, ting(), 34.95, 0.4); place(sfx, heehaw(), 35.62, 0.55); place(sfx, buzzer(), 35.7, 0.35)
place(sfx, thunk(), 36.8, 0.6)
place(sfx, sweep(300, 1400, 1.0), 37.8, 0.5); place(sfx, cheer(1.2), 38.9, 0.5)   # bar shoots up
place(sfx, thunk(), 40.78, 1.0); place(sfx, crash(), 40.8, 0.25)              # REJECTED stamp
place(sfx, wahwah(), 41.9, 0.5)                                               # no seat
place(sfx, cheer(1.8), 43.5, 0.5)                                             # crowd with signs
place(sfx, whoosh(0.6), 45.5, 0.4)
place(sfx, whoosh(1.6), 47.0, 0.5); place(sfx, pop(1300), 48.6, 0.6)          # paper plane lands in Canada
for i in range(4): place(sfx, flip(), 49.1 + i * 0.24, 0.8)                   # calendar pages
place(sfx, chime(), 50.4, 0.4)                                                # snow
place(sfx, cheer(1.6), 51.95, 0.7); place(sfx, fanfare(), 51.95, 0.4)
place(sfx, ting(1500), 53.95, 0.5)
for i in range(5): place(sfx, scribble(), 54.6 + i * 0.22, 0.6)
place(sfx, thunk(), 55.8, 0.8)                                                # NONE! stamp
for i in range(4): place(sfx, pop(800 + i * 100), 56.65 + i * 0.15, 0.4)
place(sfx, ting(2200), 58.65, 0.5); place(sfx, fanfare(), 58.9, 0.3)

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
