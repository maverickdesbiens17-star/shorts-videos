"""Original synthesized score + SFX for the bicycle-africa short (Kazimierz Nowak 1931-36): a brisk 2/4 "road diary" at 116 bpm
in A major — plucked guitar/banjo off-beats, accordion-style pad (a nod to Poland), walking bass, shaker; bicycle-bell motif.
Quiet and minor (A minor) for "He died... forgotten", drop on "The twist?". Music and SFX at 50 % of the voice (gated RMS)."""
import json, numpy as np, soundfile as sf
from scipy.signal import lfilter
SR = 48000
voice, vsr = sf.read("voice/voice.wav")
x = np.arange(len(voice) * 2) / 2.0
voice = np.interp(x, np.arange(len(voice)), voice)
N = len(voice); rng = np.random.default_rng(1931)
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

# word times (same weighting as main.js)
SEGS = json.load(open("voice/segments.json")); WORDS = []
for s in SEGS:
    ws = s["text"].split(); wt = [len("".join(c for c in w if c.isalnum())) + 1.5 + (2 if w[-1] in ".,?:" else 0) for w in ws]; tt = s["start"]
    for w, k in zip(ws, wt): d = (s["end"] - s["start"]) * k / sum(wt); WORDS.append(("".join(c for c in w.lower() if c.isalnum()), tt)); tt += d
def T_(w, n=0):
    hits = [t for x, t in WORDS if x == w]; return hits[n]
SEG = lambda i: SEGS[i]["start"]

# ---------------- music ----------------
music = np.zeros(N); BPM = 116; beat = 60 / BPM; bar = 2 * beat
def accordion(notes, dur):
    t = np.arange(int(dur * SR)) / SR
    s = sum(sum(np.sign(np.sin(2 * np.pi * mid(n) * t * (1 + d))) * 0.5 + np.sin(2 * np.pi * mid(n) * t * (1 + d)) for d in (0, 0.004)) for n in notes)
    e = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.08) * (1 + 0.12 * np.sin(2 * np.pi * 5 * t)); return lp(s, 0.06) * e / len(notes)
def bass(n, dur=0.3):
    t = np.arange(int(dur * SR)) / SR; return (np.sin(2 * np.pi * mid(n) * t) + 0.3 * np.sin(4 * np.pi * mid(n) * t)) * env(len(t), 0.004, 0.16)
def shaker(): n = noise(0.07); return (n - lp(n, 0.3)) * env(len(n), 0.01, 0.03)
MAJ = [[45, 57, 61, 64], [50, 57, 62, 66], [52, 56, 59, 64], [45, 57, 61, 64]]      # A  D  E  A
MIN = [[45, 57, 60, 64], [41, 57, 60, 65], [40, 55, 59, 64], [45, 57, 60, 64]]      # Am F  Em Am
SAD0, SAD1 = SEG(12) - 0.1, SEG(13)
TW0, TW1 = SEG(11) - 0.05, T_("in", 2) - 0.05
t = 0.0; b = 0
while t < N / SR:
    sad = SAD0 <= t < SAD1; ch_ = (MIN if sad else MAJ)[(b // 2) % 4]
    lvl = 0.6 if t < SEG(2) else 0.85 if t < SEG(10) else 1.0
    if sad: lvl = 0.55
    if TW0 <= t < TW1: lvl = 0.0
    if lvl:
        place(music, bass(ch_[0] - 12), t, 0.55 * lvl); place(music, bass(ch_[0] - 5), t + beat, 0.45 * lvl)
        if not sad:
            for k in range(2): place(music, chord(ch_[1:], 0.35), t + k * beat + beat / 2, 0.55 * lvl)       # off-beat strum
            for k in range(4): place(music, shaker(), t + k * beat / 2, 0.25 * lvl)
            if b % 2 == 0: place(music, accordion(ch_[1:], bar * 2 - 0.05), t, 0.12 * lvl)
            mel = [ch_[3] + 12, ch_[2] + 12, ch_[1] + 12, ch_[2] + 12]
            if t > SEG(1) and b % 4 in (0, 1): [place(music, pl(n, 0.4), t + k * beat / 2, 0.22 * lvl) for k, n in enumerate(mel)]
        else:
            place(music, accordion(ch_[1:], bar), t, 0.1 * lvl)
            place(music, pl(ch_[3] + 12, 1.2), t, 0.25 * lvl)
    b += 1; t += bar
fade = np.ones(N); nf = int(1.2 * SR); fade[-nf:] = np.linspace(1, 0, nf); music *= fade

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

def thunder(): n = lp(noise(2.0), 0.02) * 6; return n * env(len(n), 0.01, 0.6)
def woof(): s = sweep(420, 260, 0.18, lambda p: np.sign(np.sin(p))) * 0.5; return lp(s, 0.25)
def oink(): s = sweep(300, 220, 0.25, lambda p: np.sign(np.sin(p)) * 0.5 + np.sin(3 * p)); return lp(s, 0.2) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 30 * np.arange(len(s)) / SR)))
def cluck(): return sum(np.roll(np.pad(lp(sweep(900, 600, 0.06), 0.4), (0, int(0.4 * SR))), int(i * 0.1 * SR)) for i in range(3))
def chirp(): return np.concatenate([sweep(2600, 3600, 0.08), sweep(3200, 2300, 0.1)])
def shh(): n = lp(noise(0.7), 0.6) - lp(noise(0.7), 0.1); return n * np.sin(np.linspace(0, np.pi, len(n)))
def click(): return lp(noise(0.03), 0.9) * env(int(0.03 * SR), 0.0005, 0.005) + tone(2400, 0.03) * env(int(0.03 * SR), 0.0005, 0.01)
def magic(d=0.9): return sum(sweep(800 * (1 + i * 0.5), 2400 * (1 + i * 0.5), d) * 0.3 for i in range(3))
def conch(): tt = np.arange(int(1.4 * SR)) / SR; f = 233 * (1 + 0.01 * np.sin(2 * np.pi * 5 * tt)); return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 0.1) * np.minimum(1, tt / 0.2) * np.minimum(1, (1.4 - tt) / 0.3)
def errbeep(): return np.concatenate([beep(), np.zeros(int(0.06 * SR)), beep() * 0.8])

def bike_bell(): return ting(2637) * 0.8 + np.roll(np.pad(ting(2637) * 0.6, (0, int(0.2 * SR))), int(0.16 * SR))[: len(ting(2637))] if False else np.concatenate([ting(2637)[: int(0.16 * SR)], ting(2637)])
def thump(): s = tone(70, 0.25) + lp(noise(0.25), 0.25); return s * env(len(s), 0.001, 0.05)
def clank(): s = sum(tone(f, 0.6) * a for f, a in [(523, 1), (1187, 0.7), (1810, 0.5), (2730, 0.4)]); return s * env(len(s), 0.001, 0.12) + 0.6 * lp(noise(0.6), 0.5) * env(int(0.6 * SR), 0.001, 0.08)
def roar(d=1.3): n = lp(noise(d), 0.04) * (1 + 0.6 * np.sin(2 * np.pi * 34 * np.arange(int(d * SR)) / SR)); return n * np.sin(np.linspace(0, np.pi, len(n))) ** 0.5 * 5
def buzz(d=1.2): tt = np.arange(int(d * SR)) / SR; f = 560 + 40 * np.sin(2 * np.pi * 3 * tt); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 0.3) * 0.3 * np.sin(np.linspace(0, np.pi, len(tt)))
def neigh(): return sweep(900, 1400, 0.25) * 0.6 + np.pad(sweep(1300, 700, 0.6) * (1 + 0.5 * np.sin(2 * np.pi * 18 * np.arange(int(0.6 * SR)) / SR)), (int(0.2 * SR), 0))[: int(0.85 * SR)].__array__() * 0 + 0
def grunt(): s = sweep(140, 90, 0.5, lambda p: np.sign(np.sin(p))); return lp(s, 0.1) * 0.8
def whistle(): tt = np.arange(int(0.7 * SR)) / SR; f = 2600 + 200 * np.sign(np.sin(2 * np.pi * 30 * tt)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.01, 0.5) * 0.6
def zip_(): return sweep(300, 1600, 0.25) * 0.5
def tick(): return lp(noise(0.02), 0.9) * env(int(0.02 * SR), 0.0005, 0.004)

for s in STARTS[1:]: place(sfx, whoosh(0.35), s - 0.15, 0.25)
place(sfx, sweep(200, 600, 1.2) * 0.3, 0.05, 0.4)                                            # sunrise swell
place(sfx, bike_bell(), T_("one", 1) + 0.1, 0.5); place(sfx, splash() * 0.3, T_("one", 1) + 0.5, 0.4)
for i in range(18): place(sfx, tick(), T_("forty") + i * 0.14, 0.6)                           # odometer
place(sfx, ting(1760), T_("africa"), 0.4)
place(sfx, pop(900), T_("kazimierz"), 0.5); place(sfx, bike_bell(), SEG(1) + 0.3, 0.3)
place(sfx, click(), T_("polish") + 0.3, 0.8); place(sfx, click(), T_("reporter") + 0.2, 0.8)       # camera shutter
place(sfx, wahwah() * 0.5, T_("almost"), 0.5); place(sfx, pop(300), T_("money"), 0.6)
place(sfx, thump(), SEG(2) + 0.1, 1.0); place(sfx, pop(1000), SEG(2) + 0.2, 0.5)               # POSTMARK
place(sfx, bike_bell(), T_("he", 0) + 0.1, 0.45); place(sfx, thump(), T_("libya"), 0.8)
place(sfx, gush(1.2) * 0.5, SEG(3), 0.5)                                                       # desert wind
place(sfx, whistle(), T_("soldiers") + 0.05, 0.5); place(sfx, thunk(), T_("spy"), 0.9)
for i in range(4): place(sfx, thump() * 0.5, T_("on", 0) + 0.2 + i * 0.42, 0.6)                # heavy steps in sand
place(sfx, buzz(1.6), SEG(4), 0.6); place(sfx, thunk(), T_("malaria"), 0.7)
place(sfx, roar(1.4), T_("lion") - 0.1, 0.9); place(sfx, crash() * 0.4, T_("lion"), 0.5)
place(sfx, thump(), SEG(5) + 0.1, 1.0); place(sfx, pop(1000), SEG(5) + 0.2, 0.5)
place(sfx, fanfare(), T_("cape") + 0.05, 0.5); place(sfx, cheer(1.4), T_("cape") + 0.3, 0.5); place(sfx, sweep(900, 300, 0.6) * 0.4, T_("tip"), 0.5)
place(sfx, ting(1900), T_("free"), 0.4); place(sfx, buzzer(), T_("he", 2) + 0.25, 0.4)
place(sfx, bike_bell(), T_("rides", 1), 0.45); place(sfx, sweep(400, 1200, 0.5) * 0.5, T_("back"), 0.4)
place(sfx, thump(), SEG(7) + 0.1, 0.9); place(sfx, clank(), T_("breaks"), 1.0); place(sfx, crash() * 0.5, T_("breaks") + 0.05, 0.6)
for i in range(3): place(sfx, ting(1200 + i * 300) * 0.4, T_("breaks") + 0.3 + i * 0.12, 0.4)
place(sfx, sweep(1300, 800, 0.6) * 0.5, T_("horse") + 0.05, 0.5); place(sfx, cluck() * 0, T_("horse"), 0)
for i in range(4): place(sfx, thunk() * 0.5, T_("horse") + 0.3 + i * 0.18, 0.4)                # hooves
place(sfx, splash(), SEG(8) + 0.1, 0.7); place(sfx, magic(0.6), T_("wife"), 0.3)
place(sfx, grunt(), T_("five") + 0.2, 0.8)
for i in range(5): place(sfx, pop(800 + i * 80), T_("five") + i * 0.18, 0.3)
for i in range(6): place(sfx, zip_(), SEG(9) + 0.1 + i * 0.4, 0.35)                            # letters fly
for i in range(8): place(sfx, typer(), T_("and", 3) + 0.1 + i * 0.09, 1.0)
place(sfx, thunk(), T_("printed"), 0.7)
place(sfx, thump(), SEG(10) + 0.1, 1.0); place(sfx, pop(1000), SEG(10) + 0.2, 0.5)
place(sfx, bike_bell(), T_("algiers"), 0.5); place(sfx, fanfare(), T_("five", 1), 0.6); place(sfx, cheer(2.0), T_("five", 1) + 0.1, 0.7); place(sfx, ting(2000), T_("done"), 0.6)
place(sfx, crash(), SEG(11), 0.6); place(sfx, thump() * 1.5, SEG(11), 1.0)
place(sfx, sweep(600, 300, 0.4) * 0.4, T_("arrogance"), 0.5)
place(sfx, cheer(1.2) * 0.6, T_("he", 4) + 0.3, 0.4); place(sfx, gush(1.0) * 0.3, T_("he", 4), 0.3)    # laughter + fire
place(sfx, scribble(), T_("criticised") + 0.2, 0.9); place(sfx, thunk(), T_("criticised"), 0.6)
place(sfx, chime() * 0.5, SEG(12) + 0.2, 0.3)
place(sfx, gush(1.0) * 0.4, T_("forgotten"), 0.4)
for i in range(3): place(sfx, bike_bell() * 0.6, T_("until") + 0.2 + i * 0.6, 0.4)
place(sfx, ting(1700), T_("relay"), 0.4)
place(sfx, thunk(), SEG(13) + 0.2, 0.6); place(sfx, buzzer(), T_("conquer"), 0.4)
for i in range(3): place(sfx, ting(1500 + i * 250) * 0.4, T_("they") + i * 0.25, 0.3)
place(sfx, bike_bell(), SEG(14) + 0.2, 0.5); place(sfx, thump(), SEG(14) + 0.8, 0.8)

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
