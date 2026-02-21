//Step 1 -- Create an Audio Context
let audioContext = null;
let analyser = null;

const playButton = document.getElementById("playButton");
const audioElement = document.querySelector("audio");


playButton.addEventListener("click", function () {
  console.log("running");
  if (audioContext === null) {
    audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination)
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
