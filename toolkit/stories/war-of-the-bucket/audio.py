"""Original synthesized score + SFX for the bucket short, mixed so music and SFX sit at 50 % of the voice level."""
import json, numpy as np, soundfile as sf
SR = 48000
voice, vsr = sf.read("voice/voice.wav")
# resample voice 24k -> 48k (linear is fine for speech at this ratio)
x = np.arange(len(voice) * 2) / 2.0
voice = np.interp(x, np.arange(len(voice)), voice)
N = len(voice); t = np.arange(N) / SR
rng = np.random.default_rng(7)

def env(n, a=0.005, r=0.2):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    e *= np.exp(-np.arange(n) / (r * SR)); return e
def place(buf, sig, at, gain=1.0):
    i = int(at * SR); j = min(len(buf), i + len(sig))
    if i < len(buf): buf[i:j] += gain * sig[: j - i]
def tone(f, dur, wave="sine"):
    tt = np.arange(int(dur * SR)) / SR; ph = 2 * np.pi * f * tt
    if wave == "saw": return 2 * ((f * tt) % 1) - 1
    if wave == "tri": return 2 * np.abs(2 * ((f * tt) % 1) - 1) - 1
    return np.sin(ph)
from scipy.signal import lfilter
def lp(sig, k=0.1): return lfilter([k], [1, -(1 - k)], sig)
def noise(dur): return rng.standard_normal(int(dur * SR))
mid = lambda n: 440 * 2 ** ((n - 69) / 12)

# ---------------- music: sneaky medieval march, D minor, 104 bpm ----------------
seg = json.load(open("voice/segments.json"))
STOP, RESUME = 45.40, 46.50
music = np.zeros(N); beat = 60 / 104
kick = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 45, int(0.25 * SR))) / SR) * env(int(0.25 * SR), 0.001, 0.08)
snare = lp(noise(0.18), 0.5) * env(int(0.18 * SR), 0.001, 0.05) * 0.6
bassline = [50, 50, 57, 50, 48, 48, 55, 48, 46, 46, 53, 46, 45, 45, 52, 57]  # D, C, Bb, A
melody = [74, None, 77, 76, 74, None, 72, 69, 70, None, 72, 74, 69, None, None, None]
b = 0; tb = 0.0
while tb < N / SR:
    in_stop = STOP <= tb < RESUME
    if not in_stop:
        lvl = 0.7 if tb >= RESUME else 1.0
        if b % 4 in (0, 2): place(music, kick, tb, 0.9 * lvl)
        if b % 4 in (1, 3): place(music, snare, tb, 0.7 * lvl)
        n = bassline[(b // 1) % 16]
        pl = tone(mid(n - 12), beat * 0.9, "tri") * env(int(beat * 0.9 * SR), 0.004, 0.25)
        place(music, pl, tb, 0.55 * lvl)
        m = melody[b % 16]
        if m and (b // 16) % 2 == 1:
            note = (tone(mid(m), beat * 0.95, "saw") * 0.3 + tone(mid(m), beat * 0.95)) * env(int(beat * 0.95 * SR), 0.02, 0.35)
            place(music, lp(note, 0.15), tb, 0.35 * lvl)
    tb += beat; b += 1
# brass-ish pad under the whole thing (except the stop)
pad = np.zeros(N)
for i, chord in enumerate([[62, 65, 69], [60, 64, 67], [58, 62, 65], [57, 61, 64]]):
    pass
bar = beat * 4; tb = 0.0; k = 0
chords = [[50, 57, 62, 65], [48, 55, 60, 64], [46, 53, 58, 62], [45, 52, 57, 61]]
while tb < N / SR:
    if not (STOP - bar < tb < RESUME):
        s = sum(tone(mid(n), bar) for n in chords[k % 4]) / 4
        e = np.minimum(1, np.minimum(np.arange(len(s)) / (0.3 * SR), (len(s) - np.arange(len(s))) / (0.3 * SR)))
        place(pad, lp(s, 0.05) * e, tb, 0.5)
    tb += bar; k += 1
music += pad
# low drone through the stop + sting
dr = (tone(36.7, 2.2) + 0.5 * tone(73.4, 2.2)) * np.minimum(1, np.arange(int(2.2 * SR)) / (0.05 * SR)) * np.exp(-np.arange(int(2.2 * SR)) / (1.2 * SR))
place(music, dr, STOP, 0.9)
# fade music in the last 1.2 s
fade = np.ones(N); nf = int(1.2 * SR); fade[-nf:] = np.linspace(1, 0, nf); music *= fade

# ---------------- SFX ----------------
sfx = np.zeros(N)
def whoosh(d=0.45):
    n = noise(d); e = np.sin(np.linspace(0, np.pi, len(n))) ** 2; return lp(n, 0.06) * e * 3
def ting():
    s = sum(tone(f, 1.2) * a for f, a in [(1568, 1), (2350, 0.5), (3136, 0.3)]); return s * env(len(s), 0.001, 0.35)
def thunk(): s = tone(90, 0.3) + lp(noise(0.3), 0.3) * 0.5; return s * env(len(s), 0.001, 0.07)
def rip():
    n = noise(0.7); g = (rng.random(len(n)) > 0.6).astype(float); return lp(n * g, 0.5) * env(len(n), 0.01, 0.35) * 1.5
def hoof(): s = lp(noise(0.06), 0.4) + tone(180, 0.06) * 0.6; return s * env(len(s), 0.001, 0.015)
def cheer(d):
    n = sum(lp(noise(d), 0.08 + 0.04 * i) * np.sin(2 * np.pi * (0.6 + i) * np.arange(int(d * SR)) / SR) for i in range(4))
    e = np.minimum(1, np.minimum(np.arange(len(n)) / (0.2 * SR), (len(n) - np.arange(len(n))) / (0.4 * SR))); return n * e
def pop(): s = tone(600, 0.12) * np.linspace(1, 0, int(0.12 * SR)) ** 2; return s

def fanfare():
    out = np.zeros(int(1.4 * SR)); tt = 0
    for n, dl in [(67, 0.18), (67, 0.12), (72, 0.18), (76, 0.5)]:
        k = int(dl * SR); x = np.arange(k) / SR; f = mid(n) * (1 + 0.006 * np.sin(2 * np.pi * 6 * x))
        sig = (2 * ((np.cumsum(f) / SR) % 1) - 1) * env(k, 0.01, 0.4)
        out[int(tt * SR): int(tt * SR) + k] += lp(sig, 0.25); tt += dl
    return out
def stomp(): s = tone(60, 0.25) + lp(noise(0.25), 0.15); return s * env(len(s), 0.002, 0.06)
def boo(d=1.0):
    n = lp(noise(d), 0.03) * (1 + 0.5 * np.sin(2 * np.pi * 3 * np.arange(int(d * SR)) / SR)); e = np.sin(np.linspace(0, np.pi, len(n))); return n * e * 3
def slidewhistle(up=False):
    k = int(0.5 * SR); f = np.linspace(900, 300, k) if not up else np.linspace(300, 900, k); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(k, 0.01, 0.4)

SH = [1.72, 2.95, 5.25, 8.85, 11.4, 12.55, 13.62, 15.75, 16.5, 18.15, 18.7, 19.23, 21.8, 23.55, 25.15, 26.05, 27.45, 28.6, 30.6, 31.45, 33.95, 34.6, 36.2, 37.6, 38.7, 39.9, 41.35, 43.3, 46.45, 48.6, 50.25, 51.45]
for s in SH: place(sfx, whoosh(0.35), s - 0.15, 0.25)
for i in range(7): place(sfx, stomp(), 0.2 + i * 0.36, 0.8)            # army marching
for i in range(4): place(sfx, stomp(), 1.75 + i * 0.3, 1.0)            # close-up march
place(sfx, ting(), 3.0, 0.35)                                          # 7,000 pops
place(sfx, thunk(), 5.45, 0.8)                                         # stamp NOVEMBER 1325
place(sfx, pop(), 7.6, 0.8)                                            # pin on the map
place(sfx, boo(1.0), 10.1, 0.35)                                       # the two shout at each other
place(sfx, thunk(), 13.65, 0.9)                                        # flag swap
place(sfx, fanfare(), 15.8, 0.9)                                       # trumpets
for i in range(5): place(sfx, stomp(), 16.55 + i * 0.32, 0.8)          # army pours out
place(sfx, hoof(), 18.2, 0.8); place(sfx, hoof(), 18.4, 0.8)           # knight
place(sfx, thunk(), 18.75, 0.5)                                        # archers
place(sfx, pop(), 22.75, 0.9)                                          # gulp
place(sfx, thunk(), 23.6, 1.0); place(sfx, cheer(1.4), 23.6, 0.6)      # attack!
place(sfx, slidewhistle(), 25.3, 0.6)                                  # sun drops
place(sfx, cheer(1.3), 26.1, 0.25)                                     # rout
place(sfx, slidewhistle(True), 27.5, 0.4)
place(sfx, thunk(), 30.62, 1.0)                                        # gate slams
place(sfx, cheer(0.9), 30.7, 0.35)                                     # Modena laughs
for i in range(12): place(sfx, hoof(), 31.5 + i * 0.2 + (i % 2) * 0.07, 0.6)   # gallop
place(sfx, boo(0.7), 34.65, 0.4)                                       # angry guards
for i in range(8): place(sfx, hoof(), 34.65 + i * 0.2, 0.5)
place(sfx, ting(), 37.85, 0.4)                                         # "!"
place(sfx, ting(), 38.75, 0.55)                                        # the bucket
place(sfx, pop(), 40.15, 0.7)                                          # took it
place(sfx, thunk(), 41.6, 0.8)                                         # THE LEGEND stamp
place(sfx, rip(), 45.38, 1.0)                                          # legend tears
place(sfx, cheer(2.1), 46.5, 0.45)                                     # parade
place(sfx, thunk(), 47.6, 0.7)                                         # SOUVENIR stamp
place(sfx, thunk(), 48.75, 0.7)                                        # 700 YEARS LATER stamp
place(sfx, ting(), 50.3, 0.4)
place(sfx, ting(), 52.0, 0.3)

# ---------------- mix: music & SFX at 50 % of the voice (gated RMS) ----------------
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
