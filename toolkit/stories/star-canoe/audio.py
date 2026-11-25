"""Original synthesized score + SFX for the star-canoe short (Hokule'a 1976): a slow 6/8 "ocean lullaby" at 92 bpm in D major —
woody marimba arpeggios, low pahu-style drum, warm string pad, ocean-wash bed; quiet at night, fuller at the Tahiti arrival,
a drop on "The twist?". Music and SFX at 50 % of the voice (gated RMS). Word times are computed exactly like main.js."""
import json, numpy as np, soundfile as sf
from scipy.signal import lfilter
SR = 48000
voice, vsr = sf.read("voice/voice.wav")
x = np.arange(len(voice) * 2) / 2.0
voice = np.interp(x, np.arange(len(voice)), voice)
N = len(voice); rng = np.random.default_rng(1976)
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
music = np.zeros(N); BPM = 92; e8 = 60 / BPM / 2          # 6/8: 6 eighths per bar
def marimba(n, dur=0.6):
    t = np.arange(int(dur * SR)) / SR; f = mid(n)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 3.9 * f * t) * np.exp(-t * 30)) * env(len(t), 0.001, 0.18)
def pad(notes, dur):
    t = np.arange(int(dur * SR)) / SR; s = sum(np.sin(2 * np.pi * mid(n) * t * (1 + 0.002 * k)) + 0.3 * np.sin(2 * np.pi * 2 * mid(n) * t) for k, n in enumerate(notes))
    e = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6); return lp(s, 0.08) * e / len(notes)
def pahu(): s = tone(62, 0.5) * np.exp(-np.arange(int(0.5 * SR)) / (0.12 * SR)) + 0.3 * lp(noise(0.5), 0.05) * env(int(0.5 * SR), 0.001, 0.04); return s
prog = [[50, 54, 57, 62], [47, 50, 54, 59], [43, 47, 50, 55], [45, 49, 52, 57]]     # D  Bm  G  A
arp = [0, 1, 2, 3, 2, 1]
TW0, TW1 = SEG(12) - 0.05, T_("family") - 0.1
bar = 6 * e8; t = 0.0; b = 0
while t < N / SR:
    ch_ = prog[b % 4]
    lvl = 0.55 if t < SEG(4) else 0.75 if t < SEG(11) else 1.0
    if 32.0 < t < 41.4: lvl *= 0.8                                    # night sailing, softer
    if TW0 <= t < TW1: lvl = 0.0
    if lvl:
        place(music, pad(ch_, bar + 0.6), t, 0.35 * lvl)
        for i, k in enumerate(arp): place(music, marimba(ch_[k] + 12, 0.5), t + i * e8, 0.32 * lvl * (1.2 if i == 0 else 0.9))
        if t > SEG(2): place(music, pahu(), t, 0.6 * lvl); place(music, pahu() * 0.6, t + 3 * e8, 0.5 * lvl)
        if t > SEG(11): place(music, marimba(ch_[3] + 24, 0.4), t + 4 * e8, 0.18 * lvl)
    b += 1; t += bar
wash = lp(noise(N / SR), 0.01); wash *= 0.5 + 0.5 * np.sin(2 * np.pi * np.arange(N) / SR / 6.5) ** 2; music += 0.25 * wash / np.abs(wash).max()
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

for s in STARTS[1:]: place(sfx, whoosh(0.35), s - 0.15, 0.25)
place(sfx, whoosh(0.8), 0.0, 0.35); place(sfx, thunk(), 0.35, 0.8)                         # VS badge
for i in range(4): place(sfx, splash() * 0.4, 1.3 + i * 0.35, 0.5)                           # canoes crossing the map
place(sfx, pop(1000), T_("pacific"), 0.6)
place(sfx, ting(2000), 3.3, 0.5); place(sfx, ting(1500), 3.5, 0.3)                           # ✓ / ?
place(sfx, thunk(), SEG(1) + 0.1, 0.9)                                                       # MAN #1 stamp
place(sfx, pop(900), T_("thor"), 0.5); place(sfx, gush(1.0) * 0.4, 7.1, 0.5); place(sfx, pop(1100), T_("explorer"), 0.5)
place(sfx, splash(), SEG(2) + 0.1, 0.7)
for i in range(8): place(sfx, pop(700 + i * 60), SEG(2) + i * 0.1, 0.25)                      # 1947 counter
place(sfx, pop(800), T_("peru"), 0.7); place(sfx, sweep(500, 300, 0.8) * 0.3, T_("peru") + 0.3, 0.4)
place(sfx, scribble(), T_("south"), 0.8); place(sfx, ting(1700), T_("america"), 0.5)
for i in range(3): place(sfx, scribble(), SEG(3) + 0.1 + i * 0.35, 0.6)                       # chalk
place(sfx, thunder(), T_("accident") - 0.05, 0.9); place(sfx, gush(1.4), T_("accident"), 0.6)
place(sfx, thunk(), SEG(4) + 0.1, 0.9); place(sfx, pop(950), T_("mau", 0), 0.5)
place(sfx, sweep(1400, 300, 1.2) * 0.4, T_("tiny"), 0.6); place(sfx, pop(1200), T_("satawal"), 0.8)
for i in range(3): place(sfx, sweep(400, 800, 0.2), SEG(5) + 0.2 + i * 0.15, 0.4)              # ? boings
place(sfx, gush(1.2) * 0.6, T_("ancient") + 0.6, 0.6); place(sfx, thunk(), T_("ancient") + 0.25, 0.8)   # crumble + LOST stamp
for i in range(5): place(sfx, flip(), SEG(6) + i * 0.2, 0.8)
place(sfx, conch(), T_("mau", 1) + 0.05, 0.45)
place(sfx, pop(900), T_("double") + 0.3, 0.5); place(sfx, pop(1100), T_("double") + 0.5, 0.5)
place(sfx, splash(), T_("maui") + 0.1, 0.6)
place(sfx, buzzer(), T_("compass") + 0.15, 0.4); place(sfx, buzzer(), T_("map") + 0.12, 0.4)
place(sfx, buzzer(), T_("instruments") + 0.1, 0.35); place(sfx, buzzer(), T_("instruments") + 0.35, 0.35); place(sfx, thunk(), T_("instruments") + 0.5, 0.8)
for i in range(3): place(sfx, chime(), T_("rising") + i * 0.3, 0.3)
place(sfx, gush(1.2), T_("ocean"), 0.6)
for i in range(4): place(sfx, chirp(), T_("birds") + i * 0.22, 0.25)
for i in range(11): place(sfx, pop(800 + i * 40), T_("fifteen") + i * 0.08, 0.3)
place(sfx, woof(), T_("dog") + 0.05, 0.8); place(sfx, oink(), T_("pig") + 0.05, 0.8); place(sfx, cluck(), T_("chickens"), 0.6)
for i in range(10): place(sfx, flip(), SEG(10) + i * 0.083, 0.4)                              # days racing
for i in range(3): place(sfx, chirp(), T_("white") + 0.1 + i * 0.3, 0.35)
place(sfx, crash() * 0.5, T_("land"), 0.6); place(sfx, cheer(1.4), T_("land") + 0.1, 0.6)
for i in range(4): place(sfx, flip(), SEG(11) + i * 0.14, 0.8)
place(sfx, conch(), T_("tahiti"), 0.4); place(sfx, pop(1000), T_("tahiti") + 0.05, 0.5)
place(sfx, cheer(2.2), T_("over", 0), 0.7); place(sfx, cheer(1.8), T_("seventeen") + 0.6, 0.6)
for i in range(10): place(sfx, pop(900 + i * 50), T_("seventeen") + i * 0.1, 0.25)
place(sfx, crash(), SEG(12), 0.6); place(sfx, pahu() * 1.5, SEG(12), 1.0)
place(sfx, shh(), T_("family") + 0.15, 0.6); place(sfx, click(), T_("family") + 0.45, 0.9)
place(sfx, magic(1.0), T_("mau", 2) + 0.35, 0.5); place(sfx, ting(2200), T_("mau", 2) + 1.25, 0.5)
place(sfx, chime(), SEG(13) + 0.05, 0.35); place(sfx, pop(1000), T_("nainoa"), 0.5)
for i in range(7): place(sfx, sweep(600, 1200, 0.35) * 0.4, T_("voyages") + i * 0.25, 0.3)
place(sfx, scribble(), T_("primitive") + 0.25, 0.9); place(sfx, ting(1800), T_("primitive") + 0.6, 0.3)
for i in range(6): place(sfx, chime() * 0.5, T_("its") + i * 0.22, 0.35)
place(sfx, ting(2100), T_("science"), 0.5)
place(sfx, errbeep(), SEG(15) + 0.1, 0.6)
place(sfx, chime(), T_("without"), 0.4); place(sfx, pop(1200), T_("without") + 0.2, 0.5)

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
