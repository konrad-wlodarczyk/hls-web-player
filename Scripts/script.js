const container = document.querySelector(".container"),
mainVideo = container.querySelector("video"),
progressBar = container.querySelector(".progress-bar"),
volumeBtn = container.querySelector(".volume"),
volumeSlider = container.querySelector(".volume-slider"),
playPauseBtn = container.querySelector(".play-pause"),
skipBackward = container.querySelector(".skip-backward"),
skipForward = container.querySelector(".skip-forward");
const playPauseBtnIcon = document.querySelector(".play-pause-icon");
const volumeBtnIcon = document.querySelector(".volume-icon");

let lastVolume = 0.5;

mainVideo.addEventListener("timeupdate", e => {
    let { currentTime, duration } = e.target;
    let percent = (currentTime/duration) * 100;
    progressBar.style.width = `${percent}%`
});

mainVideo.addEventListener("click", () => {
    mainVideo.paused ? mainVideo.play() : mainVideo.pause();
});

volumeBtn.addEventListener("click", () => {
    if (mainVideo.volume > 0) {
        lastVolume = mainVideo.volume;
        mainVideo.volume = 0.0;
        volumeBtnIcon.textContent = "volume_off";
    } else {
        mainVideo.volume = lastVolume || 0.5;
        if (mainVideo.volume <= 0.5) {
            volumeBtnIcon.textContent = "volume_down";
        } else {
            volumeBtnIcon.textContent = "volume_up";
        }
    }
    // Keep slider synced
    volumeSlider.value = mainVideo.volume;
});
volumeSlider.addEventListener("input", e => {
    const volume = parseFloat(e.target.value);
    mainVideo.volume = volume;
    lastVolume = volume > 0 ? volume : lastVolume; 

    if (volume === 0) {
        volumeBtnIcon.textContent = "volume_off";
    } else if (volume <= 0.5) {
        volumeBtnIcon.textContent = "volume_down";
    } else {
        volumeBtnIcon.textContent = "volume_up";
    }
});
skipBackward.addEventListener("click", () => {
    mainVideo.currentTime -= 10;
});

skipForward.addEventListener("click", () => {
    mainVideo.currentTime += 10;
});

playPauseBtn.addEventListener("click", () =>{
    mainVideo.paused ? mainVideo.play() : mainVideo.pause();
});

mainVideo.addEventListener("play", () => {
  playPauseBtnIcon.textContent = "pause";
});

mainVideo.addEventListener("pause", () => {
  playPauseBtnIcon.textContent = "play_arrow";
});
