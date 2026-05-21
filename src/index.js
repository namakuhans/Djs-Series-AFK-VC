const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const https = require('https');
const { readConfig, writeConfig } = require('./utils');
const botManager = require('./bot');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Helper to make simple HTTP requests to Discord API directly
function discordApiRequest(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'discord.com',
      path: `/api/v9${path}`,
      method: 'GET',
      headers: {
        'Authorization': token, // Self-bot token acts directly as Authorization header
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

// API ENDPOINTS

app.get('/api/config', (req, res) => {
  const config = readConfig();
  // Mask the token before sending it to the frontend
  if (config.token) {
    const split = config.token.split('.');
    if (split.length === 3) {
      config.token = split[0] + '...' + split[2].substring(split[2].length - 5);
    } else {
      config.token = '***HIDDEN***';
    }
  }
  res.json(config);
});

app.post('/api/config', (req, res) => {
  const newConfig = req.body;
  writeConfig(newConfig);
  res.json({ success: true, message: 'Config updated' });
});

app.get('/api/status', (req, res) => {
  res.json({ status: botManager.getStatus() });
});

app.post('/api/bot/start', async (req, res) => {
  const status = botManager.getStatus();
  if (status === 'Online' || status === 'Starting') {
    return res.json({ success: true, message: 'Bot is already running or starting' });
  }
  botManager.startBot(); // start asynchronously
  res.json({ success: true, message: 'Bot start initiated' });
});

app.post('/api/bot/stop', (req, res) => {
  const result = botManager.stopBot();
  res.json(result);
});

// NEW ENDPOINTS FOR DYNAMIC SELECTION
app.post('/api/guilds', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    
    try {
        const guilds = await discordApiRequest('/users/@me/guilds', token);
        const mappedGuilds = guilds.map(g => ({ id: g.id, name: g.name }));
        res.json({ success: true, guilds: mappedGuilds });
    } catch (e) {
        res.status(401).json({ error: 'Invalid Token or Rate Limited' });
    }
});

app.post('/api/channels', async (req, res) => {
    const { token, guildId } = req.body;
    if (!token || !guildId) return res.status(400).json({ error: 'Token and Guild ID are required' });
    
    try {
        const channels = await discordApiRequest(`/guilds/${guildId}/channels`, token);
        // Filter only voice channels (type 2) and stage channels (type 13)
        const voiceChannels = channels
            .filter(c => c.type === 2 || c.type === 13)
            .map(c => ({ id: c.id, name: c.name }));
        res.json({ success: true, channels: voiceChannels });
    } catch (e) {
        res.status(401).json({ error: 'Failed to fetch channels' });
    }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
