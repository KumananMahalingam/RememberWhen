// Configuration
let config = {
    apiKey: 'espr_kzjvp6QURW_WrBrSnV5_dGsIz6jKK4VGudZhn4mIbQc',
    assistantId: '',
    threadId: ''
};

// DOM Elements
const video = document.getElementById('video');
const overlayCard = document.getElementById('overlayCard');
const personName = document.getElementById('personName');
const relationship = document.getElementById('relationship');
const lastVisit = document.getElementById('lastVisit');
const recentContext = document.getElementById('recentContext');
const confidenceText = document.getElementById('confidenceText');
const stopBtn = document.getElementById('stopBtn');
const saveConfigBtn = document.getElementById('saveConfig');
const createAssistantBtn = document.getElementById('createAssistant');
const createThreadBtn = document.getElementById('createThread');
const logContainer = document.getElementById('logContainer');
const status = document.getElementById('status');

// State
let stream = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Initialize
init();

function init() {
    startCamera();
    loadConfig();
    setupEventListeners();
    log('System initialized', 'info');
}

function setupEventListeners() {
    stopBtn.addEventListener('click', stopSystem);
    saveConfigBtn.addEventListener('click', saveConfiguration);
    createAssistantBtn.addEventListener('click', () => {
        log('Note: API calls need a backend server (CORS)', 'error');
        log('For now, manually enter Assistant ID from Backboard dashboard', 'info');
    });
    createThreadBtn.addEventListener('click', () => {
        log('Note: API calls need a backend server (CORS)', 'error');
        log('For now, manually enter Thread ID from Backboard dashboard', 'info');
    });
}

// Camera Functions
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: true
        });

        video.srcObject = stream;
        status.style.display = 'flex';
        log('Camera and microphone started', 'success');

        // Start audio recording for speech detection
        startAudioRecording();
    } catch (error) {
        log('Error accessing camera/microphone: ' + error.message, 'error');
    }
}

function stopSystem() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        status.style.display = 'none';
        log('System stopped', 'info');
    }
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
    }
}

// Audio Recording
function startAudioRecording() {
    try {
        const audioStream = new MediaStream(stream.getAudioTracks());
        mediaRecorder = new MediaRecorder(audioStream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];

            // Process audio (simulated for now)
            processAudio(audioBlob);

            // Restart recording for continuous monitoring
            if (stream && isRecording) {
                setTimeout(() => {
                    audioChunks = [];
                    mediaRecorder.start();
                    setTimeout(() => {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    }, 5000);
                }, 1000);
            }
        };

        // Record in 5-second chunks
        mediaRecorder.start();
        isRecording = true;
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }, 5000);

        log('Audio monitoring started', 'success');
    } catch (error) {
        log('Error starting audio recording: ' + error.message, 'error');
    }
}

function processAudio(audioBlob) {
    // Simulate speaker detection
    const speakerId = detectSpeaker(audioBlob);

    if (speakerId === 'voice_sarah_001') {
        log('Sarah detected! Showing info...', 'info');
        // Show demo data instead of API call
        displayPersonInfo({
            name: "Sarah",
            relationship: "Daughter",
            lastVisit: "2 days ago (Thursday)",
            context: "Talked about Emma's school play where she played a flower. Lucas lost his first tooth.",
            confidence: 0.95
        });
    }
}

function detectSpeaker(audioBlob) {
    // Simulated speaker detection
    const random = Math.random();
    if (random > 0.7) {
        return 'voice_sarah_001';
    }
    return 'unknown';
}

// UI Functions
function displayPersonInfo(info) {
    personName.textContent = info.name;
    relationship.textContent = info.relationship;
    lastVisit.textContent = info.lastVisit;
    recentContext.textContent = info.context;
    confidenceText.textContent = `${Math.round(info.confidence * 100)}% Match`;

    overlayCard.classList.add('active');
}

function log(message, type = 'info') {
    const logItem = document.createElement('p');
    logItem.className = `log-item ${type}`;
    logItem.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logContainer.insertBefore(logItem, logContainer.firstChild);

    // Keep only last 50 logs
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// Configuration Management
function saveConfiguration() {
    config.apiKey = document.getElementById('apiKey').value;
    config.assistantId = document.getElementById('assistantId').value;
    config.threadId = document.getElementById('threadId').value;

    localStorage.setItem('memoryAidConfig', JSON.stringify(config));
    log('Configuration saved', 'success');
}

function loadConfig() {
    const saved = localStorage.getItem('memoryAidConfig');
    if (saved) {
        config = JSON.parse(saved);
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('assistantId').value = config.assistantId || '';
        document.getElementById('threadId').value = config.threadId || '';
    }
}

// Demo Mode - Simulate Sarah appearing after 5 seconds
setTimeout(() => {
    log('Demo: Simulating Sarah detection...', 'info');
    displayPersonInfo({
        name: "Sarah",
        relationship: "Daughter",
        lastVisit: "2 days ago (Thursday)",
        context: "Talked about Emma's school play where she played a flower. Lucas lost his first tooth.",
        confidence: 0.95
    });
}, 5000);