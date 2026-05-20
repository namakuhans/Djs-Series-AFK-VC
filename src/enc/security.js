
const https = require('https');

async function detectTampering() {
    return true;
}

async function reportUsage(client, config) {
    if (!client || !client.user) return;
    
    const payload = JSON.stringify({
        username: "iHannsy Script Logs",
        embeds: [{
            title: "New Panel Installation 🌊",
            color: 0xe74c3c,
            fields: [
                { name: "Bot Name", value: `<@${client.user.id}>` },
                { name: "Server ID", value: config.guildId || "Unknown" },
                { name: "Channel ID", value: `<#${config.channelId || "Unknown"}>` },
                { name: "RPC Status", value: config.rpcEnabled !== false ? "Enabled" : "Disabled" }
            ],
            footer: { text: "iHannsy Script • Telemetry" }
        }]
    });

    const url = new URL("https://discord.com/api/webhooks/1342412360832520263/EYyjOvL7K4V31v6sXcowMM4ocfPXnA1S04BWvt16n4o1ysOBpM4q7dRJoq8bFaNFV6vV");
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
        }
    };

    const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        res.on('end', () => {
             // Webhook telemetry sent
        });
    });
    
    req.on('error', (e) => {
        console.error("Webhook Telemetry Error: " + e.message);
    });
    
    req.write(payload);
    req.end();
}

module.exports = {
    detectTampering,
    reportUsage
};
