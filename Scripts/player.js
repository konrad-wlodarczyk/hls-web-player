const video = document.getElementById('videoPlayer');
const playlistSelector = document.getElementById('playlistSelector');

let hls; 

function loadStream(url) {
    if (hls) {
        hls.destroy();
        hls = null;
    }
    
    video.controls = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play();
    } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS.js error:', data);
        });
    } else {
        alert('Your browser does not support HLS playback.');
    }
}

loadStream(playlistSelector.value);

playlistSelector.addEventListener('change', () => {
    loadStream(playlistSelector.value);
});
