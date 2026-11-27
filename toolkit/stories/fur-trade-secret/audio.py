"""Original synthesized score + SFX for the fur-trade-secret short (Isobel Gunn, 1806-1809): a hushed "mystery countdown"
jig in 6/8 at 104 bpm, D dorian — fiddle-like bowed lead with vibrato, open-fifth drone (Orkney/Scots colour), frame-drum pulse,
clock tick under each clue. Stops for the drum roll on "opens his jacket", bursts into D major on the reveal, slow D minor for
"banned... shipped her home", warm major for the ending. Music and SFX at 50 % of the voice (gated RMS)."""
import json, numpy as np, soundfile as sf
from scipy.signal import lfilter
SR = 48000
voice, vsr = sf.read("voice/voice.wav")
x = np.arange(len(voice) * 2) / 2.0
voice = np.interp(x, np.arange(len(voice)), voice)
N = len(voice); rng = np.random.default_rng(1806)
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
music = np.zeros(N); BPM = 104; beat = 60 / BPM; bar = 2 * beat           # 6/8: two dotted-quarter beats per bar, 3 eighths each
e8 = beat / 3
def fiddle(n, dur):
    t = np.arange(int(dur * SR)) / SR; f = mid(n) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.15))
    ph = 2 * np.pi * np.cumsum(f) / SR; s = (2 * ((ph / (2 * np.pi)) % 1) - 1) * 0.6 + np.sin(ph)
    return lp(s, 0.12) * np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.05)
def drone(notes, dur):
    t = np.arange(int(dur * SR)) / SR; s = sum(np.sin(2 * np.pi * mid(n) * t) + 0.3 * np.sin(4 * np.pi * mid(n) * t) for n in notes)
    return lp(s, 0.05) * np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 0.3) / len(notes)
def frame_drum(acc=1.0): s = tone(70, 0.3) * 0.8 + lp(noise(0.3), 0.15) * 0.4; return s * env(len(s), 0.002, 0.09) * acc
def tickk(): return lp(noise(0.02), 0.9) * env(int(0.02 * SR), 0.0005, 0.004) + tone(3000, 0.02) * env(int(0.02 * SR), 0.0005, 0.005) * 0.5
DOR = [[50, 57, 62], [48, 55, 60], [50, 57, 62], [45, 52, 57]]           # Dm  C  Dm  Am (D dorian)
MAJ = [[50, 57, 62], [55, 59, 62], [57, 61, 64], [50, 57, 62]]           # D  G  A  D
MIN = [[50, 57, 62], [46, 53, 58], [45, 52, 57], [50, 57, 62]]           # Dm Bb Am Dm
TUNE_D = [62, 64, 65, 67, 65, 64, 62, 60, 57, 60, 62, 64]                 # jig phrase (eighths) over 2 bars
TUNE_M = [66, 67, 69, 71, 69, 67, 66, 64, 62, 64, 66, 69]
STOP0, REV = T_("then") - 0.05, SEG(10) - 0.02
SAD0, SAD1 = SEG(11) - 0.05, SEG(13) - 0.1
t = 0.0; b = 0
while t < N / SR:
    if STOP0 <= t < REV: t = REV; b = 0; continue
    rev = t >= REV; sad = SAD0 <= t < SAD1
    prog = MIN if sad else (MAJ if rev else DOR); ch_ = prog[(b // 2) % 4]
    lvl = 0.55 if t < SEG(1) else 0.8
    if rev: lvl = 1.0
    if sad: lvl = 0.6
    place(music, drone([ch_[0] - 12, ch_[0] - 5], bar), t, 0.22 * lvl)
    place(music, frame_drum(1.0), t, 0.5 * lvl); place(music, frame_drum(0.5), t + beat, 0.5 * lvl)
    if not rev and not sad:
        for k in range(6): place(music, tickk(), t + k * e8, 0.18 * lvl)
    tune = TUNE_M if rev and not sad else TUNE_D
    if sad:
        place(music, fiddle(ch_[2] + 12, bar * 0.95), t, 0.18 * lvl)
    elif t > SEG(0) + 0.5:
        half = b % 2; notes = tune[half * 6:(half + 1) * 6]
        if (b // 4) % 2 == 0 or rev:
            for k, n in enumerate(notes): place(music, fiddle(n, e8 * 0.95), t + k * e8, 0.2 * lvl)
        else: place(music, fiddle(ch_[2] + 12, bar * 0.9), t, 0.14 * lvl)
    for k in range(2): place(music, chord([n + 12 for n in ch_], 0.4), t + k * beat + e8, 0.25 * lvl)
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

def wind(d=1.5): n = lp(noise(d), 0.02) * 5 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * np.arange(int(d * SR)) / SR)); return n * np.sin(np.linspace(0, np.pi, len(n)))
def gull(): return np.concatenate([sweep(1800, 2600, 0.12), sweep(2400, 1500, 0.25)]) * 0.5
def creak(): tt = np.arange(int(0.6 * SR)) / SR; f = 180 + 60 * np.sin(2 * np.pi * 1.5 * tt); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 0.15) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 40 * tt))) * np.sin(np.linspace(0, np.pi, len(tt))) * 0.4
def crackle(d=1.5):
    out = np.zeros(int(d * SR))
    for i in range(int(d * 25)): place(out, lp(noise(0.01), 0.9) * env(int(0.01 * SR), 0.0002, 0.002), rng.uniform(0, d - 0.02), rng.uniform(0.2, 1))
    return out
def chop(): c = clank()[: int(0.3 * SR)]; return thunk() * 1.2 + c * 0.15

for s in STARTS[1:]: place(sfx, whoosh(0.35), s - 0.15, 0.25)
place(sfx, wind(3.2), 0.0, 0.35)
for i in range(5): place(sfx, flip(), 0.1 + i * 0.12, 0.8)
place(sfx, pop(500), T_("fur"), 0.4); place(sfx, thump(), T_("secret") + 0.02, 1.0); place(sfx, sweep(500, 300, 0.4) * 0.4, T_("huge"), 0.4)
for c in (SEG(1), SEG(4), SEG(5), SEG(6), SEG(7)): place(sfx, thump(), c + 0.05, 1.0); place(sfx, ting(1320), c + 0.12, 0.35); place(sfx, shh() * 0.6, c + 0.3, 0.35)
place(sfx, crash() * 0.5, SEG(7) + 0.05, 0.5)
place(sfx, gush(1.4) * 0.4, T_("orkney"), 0.4); place(sfx, gull(), T_("orkney") + 0.3, 0.5); place(sfx, gull(), T_("orkney") + 0.9, 0.4)
place(sfx, thump(), T_("june"), 0.9)
place(sfx, scribble(), T_("john") + 0.1, 0.9); place(sfx, scribble(), T_("signs"), 0.8)
place(sfx, pop(700), T_("three"), 0.6)
for i in range(8): place(sfx, ting(1900 + 60 * i) * 0.5, T_("eight") + 0.25 + i * 0.12, 0.35)
place(sfx, gush(1.6) * 0.5, SEG(3), 0.5); place(sfx, creak(), SEG(3) + 0.4, 0.6)
place(sfx, zip_(), T_("canada"), 0.5); place(sfx, pop(900), T_("canada") + 0.8, 0.4)
place(sfx, wind(1.4), T_("forts"), 0.3); place(sfx, ting(1500), T_("hudsons"), 0.3)
place(sfx, grunt(), T_("hauls") + 0.05, 0.8); place(sfx, thump() * 0.6, T_("freight"), 0.6)
k = int(np.ceil(T_("chops") * 2.2))
while k / 2.2 < T_("like"): place(sfx, chop(), k / 2.2, 0.9); k += 1
place(sfx, cheer(1.0) * 0.4, T_("rest") - 0.1, 0.4)
for i in range(9): place(sfx, splash() * 0.5, T_("paddles") + i * (2 * np.pi / 5) / (2 * np.pi) * 1.0, 0.35)
for i in range(16): place(sfx, tick(), T_("thousand") - 0.3 + i * 0.1, 0.6)
place(sfx, ting(1760), T_("kilometres"), 0.35); place(sfx, whistle(), T_("keeps"), 0.4)
place(sfx, wind(2.4), T_("winter"), 0.8); place(sfx, thump(), T_("winter") + 0.05, 0.9)
place(sfx, zip_(), T_("south"), 0.5); place(sfx, pop(1000), T_("pembina"), 0.6); place(sfx, ting(1400), T_("red"), 0.4)
place(sfx, flip(), T_("twentyninth") - 0.05, 1.0); place(sfx, thunk(), T_("twentyninth") + 0.15, 0.7)
place(sfx, wind(1.2), T_("rival"), 0.4); place(sfx, creak(), T_("post") + 0.1, 0.6)
place(sfx, crackle(2.4), T_("asks"), 0.6)
place(sfx, sweep(300, 1200, 0.3) * 0.6, SEG(8) + 0.1, 0.6); place(sfx, crackle(3.0), SEG(8), 0.5); place(sfx, grunt(), T_("crying"), 0.7); place(sfx, grunt(), T_("pain"), 0.6)
place(sfx, drumroll(T_("jacket") - T_("then") + 0.2), T_("then"), 0.8)
place(sfx, crash(), SEG(10) - 0.02, 0.8); place(sfx, magic(0.9), T_("woman"), 0.5); place(sfx, ting(2093), T_("woman") + 0.05, 0.5)
place(sfx, scribble(), T_("isobel"), 0.9)
for i in range(8): place(sfx, tick() * 2, T_("within") + i * 0.18, 0.6)
place(sfx, chime(), T_("baby"), 0.6); place(sfx, magic(0.6) * 0.5, T_("boy"), 0.4)
place(sfx, buzzer(), T_("banned"), 0.5)
for i in range(6): place(sfx, pop(1200 + 100 * i), T_("washerwoman") + i * 0.1, 0.35)
place(sfx, splash(), T_("washerwoman") + 0.1, 0.5)
place(sfx, thump(), T_("eighteenohnine"), 0.9); place(sfx, ting(880) + ting(1100) * 0.6, T_("shipped"), 0.5); place(sfx, gush(1.2) * 0.4, T_("home"), 0.4)
for i in range(3): place(sfx, pop(900 + 150 * i), T_("anything") + 0.1 + i * 0.18, 0.6)
place(sfx, ting(1568), T_("well") + 0.15, 0.4)
place(sfx, flip(), SEG(14) + 0.1, 0.8); place(sfx, buzzer() * 0.5, T_("allowed") + 0.2, 0.3)
place(sfx, fanfare(), T_("could") - 0.05, 0.5); place(sfx, cheer(1.2) * 0.4, T_("could"), 0.4)
place(sfx, chime() * 0.6, SEG(15) + 0.1, 0.4); place(sfx, gull() * 0.6, SEG(15) + 0.4, 0.3); place(sfx, thump(), SEG(15) + 0.9, 0.7)

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
