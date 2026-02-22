import { normalize } from './utils.js';

//Step 1 -- Create an Audio Context
let audioContext = null;
let analyser = null;
let dataArray = null;

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
  
  const bassArray = dataArray.slice(0, 10);
  
  const bassSum = bassArray.reduce((total, currentNumber) => total + currentNumber, 0);
  
  const bassLevel = bassSum / 10;
  
  const normalizedBassLevel = normalize(bassLevel, 0, 255, 20, 0);
  
  svgPath.setAttribute('d', `M 11, 15 Q 6, ${normalizedBassLevel} 3, 15`)
}