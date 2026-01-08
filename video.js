const video = document.getElementById('video');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
let stream = null;

// Start camera
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        video.srcObject = stream;
        status.style.display = 'flex';
        console.log('Camera started');
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera: ' + error.message);
    }
}

// Stop camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        status.style.display = 'none';
        console.log('Camera stopped');
    }
}

// Event listeners
stopBtn.addEventListener('click', stopCamera);

// Start camera on load
startCamera();