const container = document.querySelector(".container"),
mainVideo = container.querySelector("video"),
progressBar = container.querySelector(".progress-bar"),
videoTimeline = container.querySelector(".video-timeline"),
volumeBtn = container.querySelector(".volume"),
volumeSlider = container.querySelector(".volume-slider"),
currentVidTime = container.querySelector(".current-time"),
videoDuration = container.querySelector(".video-duration"),
playPauseBtn = container.querySelector(".play-pause"),
skipBackward = container.querySelector(".skip-backward"),
skipForward = container.querySelector(".skip-forward");
const speedBtn = container.querySelector(".playback-speed");
speedOptions = container.querySelector(".speed-options");
const qualityBtn = container.querySelector(".quality-control");
qualityOptions = container.querySelector(".quality-options");
picInPicBtn = container.querySelector(".pic-in-pic");
fullscreenBtn = container.querySelector(".fullscreen");
const playPauseBtnIcon = document.querySelector(".play-pause-icon");
const volumeBtnIcon = document.querySelector(".volume-icon");
const fullscreenBtnIcon = document.querySelector(".fullscreen-icon");
let timer;

function updateVolumeFill() {
  const value = volumeSlider.value;
  const max = volumeSlider.max || 1;
  const percent = (value / max) * 100;
  
  volumeSlider.style.background = `linear-gradient(to right, white 0%, white ${percent}%, grey ${percent}%, grey 100%)`;
}

volumeSlider.addEventListener("input", updateVolumeFill);

updateVolumeFill();

const hideControls = () => {
    if(mainVideo.paused) return;
    timer = setTimeout(() => {
        container.classList.remove("show-controls");
    }, 1500);
}
hideControls();

container.addEventListener("mousemove", () => {
    container.classList.add("show-controls");
    clearTimeout(timer);
    hideControls();
});

let lastVolume = 0.5;
const formatTime = time => {
    let seconds = Math.floor(time % 60),
    minutes = Math.floor(time / 60) % 60,
    hours = Math.floor(time / 3600);

    seconds = seconds < 10 ? `0${seconds}` : seconds;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    hours = hours < 10 ? `0${hours}` : hours;

    if(hours == 0) {
        return `${minutes}:${seconds}`;
    }
    return `${hours}:${minutes}:${seconds}`;
}

mainVideo.addEventListener("timeupdate", e => {
    let { currentTime, duration } = e.target;
    let percent = (currentTime/duration) * 100;
    progressBar.style.width = `${percent}%`
    currentVidTime.innerText = formatTime(currentTime);
});

mainVideo.addEventListener("click", () => {
    mainVideo.paused ? mainVideo.play() : mainVideo.pause();
});

mainVideo.addEventListener("loadeddata", e => {
    videoDuration.innerText = formatTime(e.target.duration);
});

const setVideoDuration = () => {
  if (!isNaN(mainVideo.duration) && mainVideo.duration !== Infinity) {
    videoDuration.innerText = formatTime(mainVideo.duration);
  }
};

mainVideo.addEventListener("loadedmetadata", setVideoDuration);

mainVideo.addEventListener("durationchange", setVideoDuration);

if (mainVideo.readyState >= 1) {
  setVideoDuration();
}

videoTimeline.addEventListener("click", e => {
    let timelineWidth = videoTimeline.clientWidth;
    mainVideo.currentTime = (e.offsetX/timelineWidth) * mainVideo.duration;
});

let isDragging = false;

videoTimeline.addEventListener("mousedown", e => {
    isDragging = true;
    draggableProgressBar(e);
    document.addEventListener("mousemove", draggableProgressBar);
});

document.addEventListener("mouseup", () => {
    if (isDragging) {
        isDragging = false;
        document.removeEventListener("mousemove", draggableProgressBar);
    }
});

const draggableProgressBar = e => {
    if (!isDragging) return;

    const timelineRect = videoTimeline.getBoundingClientRect();
    let offsetX = e.clientX - timelineRect.left;

    if (offsetX < 0) offsetX = 0;
    if (offsetX > timelineRect.width) offsetX = timelineRect.width;

    progressBar.style.width = `${offsetX}px`;
    mainVideo.currentTime = (offsetX / timelineRect.width) * mainVideo.duration;
    currentVidTime.innerText = formatTime(mainVideo.currentTime);
};

videoTimeline.addEventListener("mousemove", e => {
    const progressTime = videoTimeline.querySelector("span");
    let offsetX = e.offsetX;
    progressTime.style.left = `${offsetX}px`;
    let timelineWidth = videoTimeline.clientWidth;
    let percent = (e.offsetX / timelineWidth) * mainVideo.duration;
    progressTime.innerText = formatTime(percent);
});

speedOptions.querySelectorAll("li").forEach(option => {
    option.addEventListener("click", () => {
        mainVideo.playbackRate = option.dataset.speed;
        const currentActive = speedOptions.querySelector(".active");
        if (currentActive) {
            currentActive.classList.remove("active");
        }

        option.classList.add("active");
    })
});

qualityBtn.addEventListener("click", () => {
    qualityOptions.classList.toggle("show")
    speedOptions.classList.remove("show");
});

speedBtn.addEventListener("click", () => {
    speedOptions.classList.toggle("show")
    qualityOptions.classList.remove("show");
});

document.addEventListener("click", e => {
    if(e.target.tagName !== "SPAN" || e.target.className !== "material-symbols-outlined"){
        speedOptions.classList.remove("show");
        qualityOptions.classList.remove("show");
    }
});

picInPicBtn.addEventListener("click", () => {
    mainVideo.requestPictureInPicture();
});

fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
        fullscreenBtnIcon.textContent = "fullscreen_exit";
        container.classList.add("fullscreen");
    } else {
        fullscreenBtnIcon.textContent = "fullscreen";
        container.classList.remove("fullscreen");
    }
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
    volumeSlider.value = mainVideo.volume;
    updateVolumeFill(); 
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
