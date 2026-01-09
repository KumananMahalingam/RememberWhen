const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve your HTML/CSS/JS files

const API_KEY = 'espr_kzjvp6QURW_WrBrSnV5_dGsIz6jKK4VGudZhn4mIbQc';

// Create Assistant
app.post('/api/create-assistant', async (req, res) => {
    try {
        const response = await fetch('https://app.backboard.io/api/assistants', {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Thread
app.post('/api/create-thread/:assistantId', async (req, res) => {
    try {
        const response = await fetch(`https://app.backboard.io/api/assistants/${req.params.assistantId}/threads`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send Message
app.post('/api/message/:threadId', async (req, res) => {
    try {
        const response = await fetch(`https://app.backboard.io/api/threads/${req.params.threadId}/messages`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});