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

## Working Style & Ground Rules

- **Akintayo writes the code.** Claude assists only when genuinely stuck — not before.
- **Pseudocode first**, implementation second. Each stage is walked through conceptually before a line of real code is written.
- **Understand the why**, not just the what. Mental models over copy-paste.
- Claude's role: comprehensive guidance, honest opinions, pushing back when warranted. Not a code dispenser.
- We go **part by part**: understand the full picture first (done ✓), then implement stage by stage.

---

## Current Status

✅ Full mental model established and understood  
⬜ Stage 1: AudioContext setup  
⬜ Stage 2: Audio element + source node  
⬜ Stage 3: Analyser node + signal chain  
⬜ Stage 4: Uint8Array + getByteFrequencyData  
⬜ Stage 5: requestAnimationFrame loop  
⬜ Stage 6: Mapping + SVG path update