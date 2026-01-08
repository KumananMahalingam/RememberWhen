(function() {
    var video = document.getElementById("video");

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        })
        .then(function(stream) {
            console.log("Stream active:", stream.active);
            video.srcObject = stream;
            video.onloadedmetadata = function(e) {
                console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
                video.play();
            };
        })
        .catch(function(error) {
            console.error("Error accessing camera:", error);
        });
    } else {
        console.error("getUserMedia is not supported");
    }
})();