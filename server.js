const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// Your Backboard API Key
const API_KEY = 'espr_kzjvp6QURW_WrBrSnV5_dGsIz6jKK4VGudZhn4mIbQc';
const BACKBOARD_API = 'https://app.backboard.io/api';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve your HTML/CSS/JS files

// ============================================
// ASSISTANT ENDPOINTS
// ============================================

// Create Assistant
app.post('/api/create-assistant', async (req, res) => {
    try {
        console.log('Creating assistant...');

        const response = await fetch(`${BACKBOARD_API}/assistants`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: req.body.name || "Memory Aid Assistant",
                description: req.body.description || "You help patients remember people and conversations. Be warm, patient, and reassuring."
            })
        });

        const data = await response.json();
        console.log('Assistant created:', data.assistant_id);
        res.json(data);
    } catch (error) {
        console.error('Error creating assistant:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Assistant
app.get('/api/assistant/:assistantId', async (req, res) => {
    try {
        const response = await fetch(`${BACKBOARD_API}/assistants/${req.params.assistantId}`, {
            headers: {
                'X-API-Key': API_KEY
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error getting assistant:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// THREAD ENDPOINTS
// ============================================

// Create Thread
app.post('/api/create-thread/:assistantId', async (req, res) => {
    try {
        console.log('Creating thread for assistant:', req.params.assistantId);

        const response = await fetch(`${BACKBOARD_API}/assistants/${req.params.assistantId}/threads`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                metadata_: req.body.metadata_ || {}
            })
        });

        const data = await response.json();
        console.log('Thread created:', data.thread_id);
        res.json(data);
    } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Thread
app.get('/api/thread/:threadId', async (req, res) => {
    try {
        const response = await fetch(`${BACKBOARD_API}/threads/${req.params.threadId}`, {
            headers: {
                'X-API-Key': API_KEY
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error getting thread:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// MESSAGE ENDPOINTS
// ============================================

// Send Message (Store or Retrieve Context)
app.post('/api/message/:threadId', async (req, res) => {
    try {
        console.log('Sending message to thread:', req.params.threadId);

        const response = await fetch(`${BACKBOARD_API}/threads/${req.params.threadId}/messages`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: req.body.content,
                memory: req.body.memory || "Auto",
                send_to_llm: req.body.send_to_llm || "false",
                model_name: req.body.model_name || "claude-sonnet-4-20250514",
                llm_provider: req.body.llm_provider || "anthropic",
                metadata: req.body.metadata || ""
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Messages from Thread
app.get('/api/messages/:threadId', async (req, res) => {
    try {
        const response = await fetch(`${BACKBOARD_API}/threads/${req.params.threadId}/messages`, {
            headers: {
                'X-API-Key': API_KEY
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// HELPER ENDPOINTS
// ============================================

// Get Person Context (simplified endpoint)
app.get('/api/person-context/:threadId', async (req, res) => {
    try {
        console.log('Fetching context for thread:', req.params.threadId);

        const response = await fetch(`${BACKBOARD_API}/threads/${req.params.threadId}/messages`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: "When did I last see this person and what did we talk about? Answer in one brief sentence.",
                memory: "Auto",
                send_to_llm: "true",
                model_name: "claude-sonnet-4-20250514",
                llm_provider: "anthropic"
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching context:', error);
        res.status(500).json({ error: error.message });
    }
});

// Store Conversation
app.post('/api/store-conversation/:threadId', async (req, res) => {
    try {
        console.log('Storing conversation:', req.body.text);

        const response = await fetch(`${BACKBOARD_API}/threads/${req.params.threadId}/messages`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: req.body.text,
                memory: "Auto",
                send_to_llm: "false",
                metadata: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    speaker: req.body.speaker
                })
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error storing conversation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add Initial Context for New Person
app.post('/api/add-initial-context/:threadId', async (req, res) => {
    try {
        console.log('Adding initial context for:', req.body.name);

        const response = await fetch(`${BACKBOARD_API}/threads/${req.params.threadId}/messages`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: req.body.context,
                memory: "Auto",
                send_to_llm: "false"
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error adding initial context:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Memory Aid Backend Server Running    ║
╠════════════════════════════════════════╣
║  Server: http://localhost:${PORT}        ║
║  Status: Ready to accept requests      ║
╚════════════════════════════════════════╝

API Endpoints:
- POST   /api/create-assistant
- GET    /api/assistant/:assistantId
- POST   /api/create-thread/:assistantId
- GET    /api/thread/:threadId
- POST   /api/message/:threadId
- GET    /api/messages/:threadId
- GET    /api/person-context/:threadId
- POST   /api/store-conversation/:threadId
- POST   /api/add-initial-context/:threadId
- GET    /api/health

Open http://localhost:${PORT} in your browser to use the app!
    `);
});