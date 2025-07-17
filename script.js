let isPlaying = false;
const playBtn = document.getElementById("play");
playBtn.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playBtn.textContent = isPlaying ? "⏸️" : "▶️";
});
