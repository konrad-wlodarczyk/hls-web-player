const container = document.querySelector(".container"),
mainVideo = container.querySelector("video"),
playPauseBtn = container.querySelector(".play-pause");

playPauseBtn.addEventListener("click", () =>{
    mainVideo.paused ? mainVideo.play() : mainVideo.pause();
})