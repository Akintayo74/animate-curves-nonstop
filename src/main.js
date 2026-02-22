import { normalize, lerp } from './utils.js';

//Step 1 -- Create an Audio Context
let audioContext = null;
let analyser = null;
let dataArray = null;

let current1X = 6;
let current1Y = 20;
let current2X = 18;
let current2Y = 20;

const playButton = document.getElementById("playButton");
const audioElement = document.querySelector("audio");
const svgPath = document.querySelector("path");


playButton.addEventListener("click", function () {
  console.log("running");
  if (audioContext === null) {
    audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    animate();
  } else if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  //Play or pause depending on state
  if (playButton.dataset.playing === "false") {
    audioElement.play();
    playButton.dataset.playing = "true";
  } else if (playButton.dataset.playing === "true") {
    audioElement.pause();
    playButton.dataset.playing = "false";
  }

});


function animate() {
  requestAnimationFrame(animate);
  
  analyser.getByteFrequencyData(dataArray);
  
  const bassArray = dataArray.slice(0, 7); 
  const bassSum = bassArray.reduce((total, currentNumber) => total + currentNumber, 0); 
  const bassLevel = bassSum / 7;
  
  const midArray = dataArray.slice(8, 64);
  const midSum = midArray.reduce((total, currentNumber) => total + currentNumber, 0);
  const midLevel = midSum / 56;
  
  const highArray = dataArray.slice(65, 127);
  const highSum = highArray.reduce((total, currentNumber) => total + currentNumber, 0);
  const highLevel = highSum / 62;
  
  const normalizedBassLevel = normalize(bassLevel, 0, 255, 20, -12);
  let oppositeNormalizedBassLevel = normalize(bassLevel, 0, 255, 20, 44);
  const normalizedMidLevel = normalize(midLevel, 0, 255, 2, 16);
  oppositeNormalizedBassLevel += normalize(highLevel, 0, 255, 0, 5);
  
  current1X = lerp(current1X, normalizedMidLevel, 0.08);
  current1Y = lerp(current1Y, normalizedBassLevel, 0.08);
  current2X = lerp(current2X, 18, 0.08);
  current2Y = lerp(current2Y, oppositeNormalizedBassLevel, 0.08);
  
  svgPath.setAttribute('d', `M 22, 20 C ${current1X}, ${current1Y}, ${current2X}, ${current2Y} 2, 20`)
}