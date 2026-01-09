// Configuration
const API_KEY = 'espr_kzjvp6QURW_WrBrSnV5_dGsIz6jKK4VGudZhn4mIbQc';
const ASSISTANT_ID = ''; // Will be set when created
const API_BASE = 'http://localhost:3000/api'; // Your backend server

// State
let stream = null;
let recognition = null;
let isStreaming = false;
let isListening = false;
let recognizedPerson = null;
let transcripts = [];
let interimTranscript = '';

// Known people (load from storage or default)
let knownPeople = JSON.parse(localStorage.getItem('knownPeople')) || [
    {
        id: 'sarah_001',
        name: 'Sarah',
        relationship: 'Daughter',
        voiceId: 'voice_sarah_001',
        threadId: '' // Will be set when thread is created
    }
];

// DOM Elements
const video = document.getElementById('video');
const statusBadge = document.getElementById('statusBadge');
const personOverlay = document.getElementById('personOverlay');
const loadingOverlay = document.getElementById('loadingOverlay');
const placeholder = document.getElementById('placeholder');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const micBtn = document.getElementById('micBtn');
const clearBtn = document.getElementById('clearBtn');
const addPersonBtn = document.getElementById('addPersonBtn');
const peopleList = document.getElementById('peopleList');
const peopleHint = document.getElementById('peopleHint');
const transcriptList = document.getElementById('transcriptList');
const transcriptEmpty = document.getElementById('transcriptEmpty');
const transcriptScroll = document.getElementById('transcriptScroll');
const listeningStatus = document.getElementById('listeningStatus');
const addPersonModal = document.getElementById('addPersonModal');
const addPersonForm = document.getElementById('addPersonForm');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const dismissBtn = document.getElementById('dismissBtn');

// Initialize
init();

function init() {
    setupEventListeners();
    renderPeopleList();
    initSpeechRecognition();
}

function setupEventListeners() {
    startBtn.addEventListener('click', startCamera);
    stopBtn.addEventListener('click', stopCamera);
    micBtn.addEventListener('click', toggleListening);
    clearBtn.addEventListener('click', clearTranscripts);
    addPersonBtn.addEventListener('click', () => addPersonModal.style.display = 'flex');
    modalClose.addEventListener('click', () => addPersonModal.style.display = 'none');
    modalCancel.addEventListener('click', () => addPersonModal.style.display = 'none');
    addPersonForm.addEventListener('submit', handleAddPerson);
    dismissBtn.addEventListener('click', () => personOverlay.style.display = 'none');
}

// Camera Functions
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
        });

        video.srcObject = stream;
        placeholder.style.display = 'none';
        statusBadge.style.display = 'flex';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        micBtn.disabled = false;
        isStreaming = true;

        // Auto-start listening
        if (recognition) {
            startListening();
        }

        // Show hint
        if (knownPeople.length > 0) {
            peopleHint.style.display = 'block';
        }

    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera or microphone: ' + error.message);
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }

    if (recognition && isListening) {
        stopListening();
    }

    placeholder.style.display = 'flex';
    statusBadge.style.display = 'none';
    startBtn.style.display = 'inline-flex';
    stopBtn.style.display = 'none';
    micBtn.disabled = true;
    isStreaming = false;
    peopleHint.style.display = 'none';
    personOverlay.style.display = 'none';
}

// Speech Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.error('Speech recognition not supported');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            if (result.isFinal) {
                addTranscript(transcript.trim(), recognizedPerson?.name || 'Unknown');
                interimTranscript = '';

                // Store to Backboard if person is recognized
                if (recognizedPerson?.threadId) {
                    storeTranscriptToBackboard(recognizedPerson.threadId, transcript.trim(), recognizedPerson.name);
                }
            } else {
                interim += transcript;
            }
        }

        if (interim) {
            interimTranscript = interim;
            renderTranscripts();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to restart recognition:', e);
            }
        }
    };
}

function startListening() {
    if (recognition) {
        try {
            recognition.start();
            isListening = true;
            updateListeningStatus();
            micBtn.innerHTML = '<span>🎤</span> Mute Mic';
        } catch (e) {
            console.error('Failed to start recognition:', e);
        }
    }
}

function stopListening() {
    if (recognition) {
        recognition.stop();
        isListening = false;
        updateListeningStatus();
        micBtn.innerHTML = '<span>🔇</span> Unmute Mic';
    }
}

function toggleListening() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

function updateListeningStatus() {
    if (isListening) {
        listeningStatus.innerHTML = '<span>🎤</span><span>Listening</span>';
        listeningStatus.classList.add('active');
    } else {
        listeningStatus.innerHTML = '<span>🔇</span><span>Not listening</span>';
        listeningStatus.classList.remove('active');
    }
}

// Transcripts
function addTranscript(text, speaker) {
    const transcript = {
        id: Date.now(),
        text: text,
        timestamp: new Date(),
        speaker: speaker
    };
    transcripts.push(transcript);
    renderTranscripts();
}

function renderTranscripts() {
    if (transcripts.length === 0 && !interimTranscript) {
        transcriptEmpty.style.display = 'block';
        transcriptList.innerHTML = '';
        return;
    }

    transcriptEmpty.style.display = 'none';

    let html = '';
    transcripts.forEach(t => {
        const time = formatTime(t.timestamp);
        html += `
            <div class="transcript-item">
                <div class="transcript-meta">
                    <span class="transcript-speaker">${t.speaker}</span>
                    <span class="transcript-time">${time}</span>
                </div>
                <p class="transcript-text">${t.text}</p>
            </div>
        `;
    });

    if (interimTranscript) {
        html += `
            <div class="transcript-item transcript-interim">
                <div class="transcript-meta">
                    <span class="transcript-speaker">Speaking...</span>
                </div>
                <p class="transcript-text">${interimTranscript}</p>
            </div>
        `;
    }

    transcriptList.innerHTML = html;
    transcriptScroll.scrollTop = transcriptScroll.scrollHeight;
}

function clearTranscripts() {
    transcripts = [];
    interimTranscript = '';
    renderTranscripts();
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// People Management
function renderPeopleList() {
    if (knownPeople.length === 0) {
        peopleList.innerHTML = '<p style="text-align: center; color: #888; padding: 1rem;">No people registered yet</p>';
        return;
    }

    let html = '';
    knownPeople.forEach(person => {
        html += `
            <li class="person-item">
                <button class="person-btn" data-id="${person.id}" ${!isStreaming ? 'disabled' : ''}>
                    <div>
                        <p class="person-name">${person.name}</p>
                        <p class="person-rel">${person.relationship}</p>
                    </div>
                </button>
                <button class="remove-btn" data-id="${person.id}">🗑️</button>
            </li>
        `;
    });

    peopleList.innerHTML = html;

    // Add event listeners
    document.querySelectorAll('.person-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const person = knownPeople.find(p => p.id === id);
            if (person) selectPerson(person);
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            removePerson(id);
        });
    });

    savePeople();
}

function handleAddPerson(e) {
    e.preventDefault();

    const name = document.getElementById('personNameInput').value.trim();
    const relationship = document.getElementById('relationshipSelect').value;

    if (!name || !relationship) return;

    const newPerson = {
        id: `person_${Date.now()}`,
        name: name,
        relationship: relationship,
        voiceId: `voice_${name.toLowerCase()}_${Date.now()}`,
        threadId: ''
    };

    knownPeople.push(newPerson);
    renderPeopleList();

    // Create thread in Backboard
    createThreadForPerson(newPerson);

    // Reset form and close modal
    addPersonForm.reset();
    addPersonModal.style.display = 'none';
}

function removePerson(id) {
    knownPeople = knownPeople.filter(p => p.id !== id);
    renderPeopleList();

    if (recognizedPerson?.id === id) {
        personOverlay.style.display = 'none';
        recognizedPerson = null;
    }
}

function selectPerson(person) {
    recognizedPerson = person;
    fetchPersonContext(person);
}

function savePeople() {
    localStorage.setItem('knownPeople', JSON.stringify(knownPeople));
}

// Person Context Display
async function fetchPersonContext(person) {
    if (!person.threadId) {
        displayPersonInfo({
            ...person,
            lastVisit: 'First visit',
            recentContext: 'This is the first recorded interaction with ' + person.name,
            confidence: 1.0
        });
        return;
    }

    loadingOverlay.style.display = 'block';

    try {
        // In production, call your backend API
        // const response = await fetch(`${API_BASE}/message/${person.threadId}`, {...});

        // Demo data for now
        setTimeout(() => {
            displayPersonInfo({
                ...person,
                lastVisit: '2 days ago (Thursday)',
                recentContext: 'Talked about Emma\'s school play where she played a flower. Lucas lost his first tooth yesterday.',
                confidence: 0.95
            });
            loadingOverlay.style.display = 'none';
        }, 1000);
    } catch (error) {
        console.error('Error fetching context:', error);
        loadingOverlay.style.display = 'none';
    }
}

function displayPersonInfo(person) {
    document.getElementById('personName').textContent = person.name;
    document.getElementById('personRelationship').textContent = person.relationship;
    document.getElementById('lastVisit').textContent = person.lastVisit;
    document.getElementById('recentContext').textContent = person.recentContext;
    document.getElementById('confidenceValue').textContent = Math.round(person.confidence * 100) + '%';

    personOverlay.style.display = 'block';
}

// Backboard API Functions (require backend server)
async function createThreadForPerson(person) {
    console.log('Creating thread for:', person.name);
    // In production with backend:
    // const response = await fetch(`${API_BASE}/create-thread/${ASSISTANT_ID}`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         metadata_: {
    //             person_name: person.name,
    //             relationship: person.relationship,
    //             voice_id: person.voiceId
    //         }
    //     })
    // });
    // const data = await response.json();
    // person.threadId = data.thread_id;
    // savePeople();
}

async function storeTranscriptToBackboard(threadId, text, speaker) {
    console.log('Storing transcript:', text);
    // In production with backend:
    // await fetch(`${API_BASE}/message/${threadId}`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         content: text,
    //         memory: 'Auto',
    //         send_to_llm: 'false',
    //         metadata: JSON.stringify({ timestamp: new Date().toISOString(), speaker })
    //     })
    // });
}

// Demo: Simulate person detection after 5 seconds
setTimeout(() => {
    if (isStreaming && knownPeople.length > 0) {
        console.log('Demo: Simulating person detection...');
        selectPerson(knownPeople[0]);
    }
}, 5000);