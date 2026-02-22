# Audio-Reactive SVG Curve — Project Brief & Mental Model

## The Idea

While tinkering with quadratic bezier curve controls in Josh Comeau's *Whimsical Animations* course and listening to Drake's *Nonstop*, Akintayo noticed the curve looked like it was dancing to the bass when he pushed the control point up and down in that 'A' shape. The project: make it actually do that. A curve (or something like it) that dances to audio based on bass and frequency levels.

---

## Technical Decisions

- **Vanilla JS**, not React. The core loop is `audio data → number → update DOM attribute` — exactly what vanilla JS is great at. No state, no re-renders, no overhead.
- **Web Audio API** directly, not `use-sound` (which is just a playback wrapper with no frequency analysis).
- **`<audio>` element** as the sound source (hardcoded track) for a clean signal, rather than microphone input.
- **`requestAnimationFrame`** loop polling the analyser, writing directly to the SVG path's `d` attribute.

---

## The Mental Model (Full Pipeline)

```
[Sound Source] → [Analyser Node] → [Frequency Data] → [Animation Loop] → [SVG Path]
```

### Stage 1: AudioContext
The environment everything lives in. Created once. Browsers require a user gesture before it can start — so the pipeline begins on a button click, not on page load.

```
on user clicks "Play":
  create AudioContext (or resume if already exists)
  kick off the rest of the pipeline
```

### Stage 2: Sound Source
```
create an <audio> element
point it at your audio file
wrap it as a source node via AudioContext
```

### Stage 3: Analyser Node
Sits in the signal chain and reads audio as it passes through — without interrupting playback.

```
create analyserNode from AudioContext
set fftSize = 256  // gives 128 frequency buckets, plenty to start

connect source → analyser → AudioContext.destination
```

`destination` = the speakers. Forgetting this = frequency data but no sound.

`fftSize` (Fast Fourier Transform) converts the raw audio wave into a frequency breakdown. Higher = more detail. 256 is a good starting point.

### Stage 4: Frequency Data
The analyser doesn't push data — you ask for it each frame.

```
create Uint8Array of size analyser.frequencyBinCount  // fftSize / 2 = 128 buckets
```

Each bucket = a number 0–255 representing energy at that frequency range.
- Index 0 → lowest bass
- Last index → highest treble

Each frame:
```
analyser.getByteFrequencyData(dataArray)  // fills array with fresh data
```

### Stage 5: Animation Loop
```
function animate():
  requestAnimationFrame(animate)        // schedules next frame (~60fps)

  analyser.getByteFrequencyData(dataArray)

  bassLevel = average of dataArray[0..9]
  controlY = map(bassLevel, 0, 255, outputMin, outputMax)

  pathElement.setAttribute('d', `M ... Q controlX,controlY ...`)
```

### Stage 6: The Mapping Utility
Translates raw bass values (0–255) into SVG coordinate space.

```
function map(value, inMin, inMax, outMin, outMax):
  return outMin + (value - inMin) / (inMax - inMin) * (outMax - outMin)
```

e.g. "when bass is 0, controlY = 150 (flat). When bass is 255, controlY = 20 (dramatic peak)."

---

## Full Pseudocode

```
// --- Setup (runs once on user click) ---

create AudioContext
create <audio> element pointing at track
create sourceNode from audio element via AudioContext
create analyserNode from AudioContext, fftSize = 256
create dataArray of size analyser.frequencyBinCount

connect source → analyser → destination

play the audio
start the animation loop


// --- Animation Loop (runs every frame) ---

function animate():
  requestAnimationFrame(animate)

  analyser.getByteFrequencyData(dataArray)

  bassLevel = average of dataArray[0..9]
  controlY = map(bassLevel, 0, 255, outputMin, outputMax)

  pathElement.setAttribute('d', `M ... Q controlX,controlY ...`)


// --- Utility ---

function map(value, inMin, inMax, outMin, outMax):
  return outMin + (value - inMin) / (inMax - inMin) * (outMax - outMin)
```

---

## What Else Could Dance (Beyond Control Point Y)

| Frequency Range | Property to Animate |
|---|---|
| Bass (buckets 0–9) | Control point Y — big dramatic swoops |
| Mids (buckets 10–50) | Control point X — lateral drift |
| Highs (buckets 50+) | Stroke width, noise/wobble on path |
| Overall amplitude | Color hue or opacity |
| Beat detection (sharp bass spike) | Spring "pulse" — snaps to extreme, eases back |

The last one (beat detection + spring physics) would look especially satisfying and pairs well with Josh's spring animation work.

---

## Phase 2: Making It Expressive (The Upgrade)

### The Goal
The basic version maps only Y values — it bobs but doesn't feel alive. The goal is **juice**: sensitive, wriggling, dancing, organic. Like a spine, not a stick.

### Key Decisions Made

**Quadratic → Cubic Bezier**

A quadratic (`Q`) has one control point. A cubic (`C`) has two. The wriggle comes from two control points pulling in *different directions simultaneously*. That tension is where the organism lives.

```
// quadratic
M startX,startY  Q controlX,controlY  endX,endY

// cubic
M startX,startY  C control1X,control1Y  control2X,control2Y  endX,endY
```

**Opposite directions for the two control points**

Same direction = the curve bobs as a rigid unit (still just a quadratic in spirit).
Opposite directions = the curve *twists against itself* — snake-like, organic.

You get this for free just by swapping `outMin` and `outMax` in the mapping for control2Y:

```
target1Y = map(bassLevel, 0, 255, centerY, topY)      // pulls up
target2Y = map(bassLevel, 0, 255, centerY, bottomY)   // pulls down (swapped)
```

**Smoothing via Lerp, not Framer Motion**

Framer Motion animates between *discrete states*. Audio is a *continuous stream* — a new target value every frame. Lerp is the right tool:

```
currentY = lerp(currentY, targetY, 0.08)
```

Every frame, current value eases toward whatever the target is *right now*. The `0.08` smoothing factor is tuned by feel — closer to 0 is dreamier, closer to 1 is snappier.

**Framer Motion still has a role** — beat detection. When a sharp bass spike is detected (a "hit"), a Framer Motion spring snap-back would feel physical and punchy. Lerp for continuous movement, Framer Motion for discrete events.

### Frequency Hierarchy

Alive things have *hierarchy* — one dominant movement with subordinate details. Mapping everything equally = visual noise, not life.

| Band | Buckets | Drives | Why |
|---|---|---|---|
| Bass | 0–7 | control1Y (up) and control2Y (down) | The big spine movement |
| Mids | 8–64 | control1X (lateral drift) | Secondary wander |
| Highs | 65–127 | Small noise added to control2Y | Nervous, alive texture |

### Expanded Pseudocode (The Full Upgrade)

```
// --- Pipeline ---
[Existing Audio Pipeline]
        ↓
[Extract bass, mids, highs from dataArray]
        ↓
[Compute raw target values for control1Y, control1X, control2Y]
        ↓
[Lerp current values toward targets — smoothing]
        ↓
[Build cubic bezier path string]
        ↓
[Update SVG path attribute]


// --- Stage 1: Extract frequency bands ---

bassLevel = average of dataArray[0..7]
midLevel  = average of dataArray[8..64]
highLevel = average of dataArray[65..127]


// --- Stage 2: Map bands to control point properties ---

target1Y = map(bassLevel, 0, 255, centerY, topY)
target2Y = map(bassLevel, 0, 255, centerY, bottomY)   // opposite direction

target1X = map(midLevel, 0, 255, control1XMin, control1XMax)

target2Y = target2Y + map(highLevel, 0, 255, 0, smallNudgeAmount)  // layer highs on top


// --- Stage 3: Lerp current values toward targets ---

// declared outside animate():
current1X = resting1X
current1Y = centerY
current2X = resting2X
current2Y = centerY

// inside animate():
current1X = lerp(current1X, target1X, smoothingFactor)
current1Y = lerp(current1Y, target1Y, smoothingFactor)
current2X = lerp(current2X, target2X, smoothingFactor)
current2Y = lerp(current2Y, target2Y, smoothingFactor)


// --- Stage 4: Build path and update DOM ---

pathElement.setAttribute('d',
  `M startX,startY C current1X,current1Y current2X,current2Y endX,endY`
)


// --- Utilities ---

function lerp(current, target, factor):
  return current + (target - current) * factor

function map(value, inMin, inMax, outMin, outMax):
  return outMin + (value - inMin) / (inMax - inMin) * (outMax - outMin)
```

---

## Working Style & Ground Rules

- **Akintayo writes the code.** Claude assists only when genuinely stuck — not before.
- **Pseudocode first**, implementation second. Each stage is walked through conceptually before a line of real code is written.
- **Understand the why**, not just the what. Mental models over copy-paste.
- Claude's role: comprehensive guidance, honest opinions, pushing back when warranted. Not a code dispenser.
- We go **part by part**: understand the full picture first (done ✓), then implement stage by stage.

---

## Current Status

✅ Full mental model established and understood  
✅ Basic audio pipeline implemented (quadratic, Y-only mapping)  
✅ Phase 2 mental model established (cubic, lerp, frequency hierarchy)  
⬜ Upgrade to cubic bezier path  
⬜ Extract bass / mids / highs from dataArray  
⬜ Map bands to control1Y, control2Y (opposite), control1X  
⬜ Add lerp smoothing for all four current values  
⬜ Layer high frequency noise onto control2Y  
⬜ Beat detection + Framer Motion spring pulse (future)