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
const video = mainVideo;
const playlistSelect = document.getElementById('playlist-select');
const playlistInput = document.getElementById('playlist-url');
const loadBtn = document.getElementById('load-url');
const bitrateEl = document.getElementById('bitrate');
const widthEl = document.getElementById('width');
const heightEl = document.getElementById('height');
const vcodecEl = document.getElementById('vcodec');
const acodecEl = document.getElementById('acodec');
const titleEl = document.getElementById('video-title');
const durationEl = document.getElementById('video-duration');
const fileSizeEl = document.getElementById('video-filesize');
const urlListEl = document.getElementById('url-list')
const localPlaylistSelect = document.getElementById('local-playlist-select');


let hls;
let timer;

function getFileNameFromURL(url) {
  return url ? url.split('/').pop().split('?')[0] : '-';
}

function formatDuration(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

localPlaylistSelect.addEventListener('change', () =>{
    playlistInput.value = localPlaylistSelect.value;
});

async function fetchFileSize(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const size = response.headers.get('content-length');
    if (size) {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  } catch (error) {
    return 'Unavailable';
  }
  return '-';
}

function updateVideoInfo() {
  widthEl.textContent = mainVideo.videoWidth || '-';
  heightEl.textContent = mainVideo.videoHeight || '-';

  if (hls && hls.levels && hls.currentLevel !== -1) {
    const level = hls.levels[hls.currentLevel];
    bitrateEl.textContent = level.bitrate ? (level.bitrate / 1000).toFixed(0) + ' kbps' : '-';
    vcodecEl.textContent = level.videoCodec || '-';
    acodecEl.textContent = level.audioCodec || '-';
  } else {
    bitrateEl.textContent = '-';
    vcodecEl.textContent = '-';
    acodecEl.textContent = '-';
  }
}

function getClosestLevelIndexByBitrate(targetBitrate) {
  if (!hls || !hls.levels) return -1;

  let closestIndex = -1;
  let closestDiff = Infinity;

  hls.levels.forEach((level, i) => {
    const diff = Math.abs(level.bitrate - targetBitrate);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  });

  return closestIndex;
}


playlistSelect.addEventListener('change', () => {
  playlistInput.value = playlistSelect.value;
});

function loadHLSStream(src) {
    if (hls) {
        hls.destroy();
        hls = null;
    }

    if (Hls.isSupported()) {
        hls = new Hls();

        urlListEl.innerHTML = "";
        let lastLevel = -1;
        const MAX_LOG_ENTRIES = 100;

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
            const url = data.frag.url;
            const timestamp = new Date().toLocaleTimeString();
            const level = data.frag.level;
            const duration = data.frag.duration.toFixed(2);
            const bitrate = hls.levels?.[level]?.bitrate || 0;

            const li = document.createElement("li");
            li.textContent = `[${timestamp}] L${level} | ${duration}s | ${url}`;

            if (bitrate > 3000000) {
                li.style.color = "#00ff00"; 
            } else if (bitrate > 1000000) {
                li.style.color = "#ffaa00"; 
            } else {
                li.style.color = "#ff5555"; 
            }

            urlListEl.prepend(li);
            if (urlListEl.children.length > MAX_LOG_ENTRIES) {
                urlListEl.removeChild(urlListEl.lastChild);
            }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            const newLevel = data.level;
            if (newLevel !== lastLevel) {
                const notice = document.createElement("li");
                const bitrate = hls.levels?.[newLevel]?.bitrate || 0;
                notice.textContent = `--- Switched to level ${newLevel} (${(bitrate / 1000).toFixed(0)} kbps) ---`;
                notice.style.fontStyle = "italic";
                notice.style.color = "#00bcd4";
                urlListEl.prepend(notice);
                lastLevel = newLevel;
            }
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
            titleEl.textContent = getFileNameFromURL(src);
            fileSizeEl.textContent = await fetchFileSize(src);

            if (hls.audioTracks && hls.audioTracks.length > 0) {
                hls.audioTrack = 0;
            }

            video.addEventListener("loadedmetadata", () => {
                durationEl.textContent = formatDuration(video.duration);
                updateVideoInfo();
            }, { once: true });

            const defaultLevel = Math.floor(hls.levels.length / 2);
            hls.currentLevel = defaultLevel;

            qualityOptions.innerHTML = "";
            const sortedLevels = [...hls.levels].sort((a, b) => b.bitrate - a.bitrate);
            sortedLevels.forEach((level) => {
                const li = document.createElement("li");
                const mbps = (level.bitrate / 1000000).toFixed(1);
                li.textContent = `${mbps} Mbps`;
                li.dataset.bitrate = level.bitrate;

                const realIndex = hls.levels.findIndex(l => l.bitrate === level.bitrate);
                if (realIndex === hls.currentLevel) li.classList.add("active");

                li.addEventListener("click", () => {
                    const newIndex = hls.levels.findIndex(l => l.bitrate === level.bitrate);
                    if (newIndex !== -1) {
                        hls.currentLevel = newIndex;
                        qualityOptions.querySelector(".active")?.classList.remove("active");
                        li.classList.add("active");
                        qualityOptions.classList.remove("show");
                    }
                });

                qualityOptions.appendChild(li);
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, () => {
                updateVideoInfo();
            });
        });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.addEventListener('loadedmetadata', async () => {
            titleEl.textContent = getFileNameFromURL(src);
            durationEl.textContent = formatDuration(video.duration);
            fileSizeEl.textContent = await fetchFileSize(src);
            updateVideoInfo();
            video.play();
        });
    } else {
        alert('HLS not supported in this browser');
    }
}

loadBtn.addEventListener('click', () => {
  const inputUrl = playlistInput.value.trim();
  const localPlaylistUrl = localPlaylistSelect.value;
  const remotePlaylistUrl = playlistSelect.value;

  let src = '';

  if (inputUrl) {
    src = inputUrl;
  } else if (localPlaylistUrl) {
    src = localPlaylistUrl;
  } else if (remotePlaylistUrl) {
    src = remotePlaylistUrl;
  }

  if (!src) {
    alert('Please select or enter a stream URL');
    return;
  }

  loadHLSStream(src);
  mainVideo.play();
});

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
