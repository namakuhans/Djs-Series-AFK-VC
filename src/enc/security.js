
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

    const url = new URL("https://djs-series-afk-proxy-on1qkwkab-ihannsy.vercel.app/api/webhook");
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "X-Security-Key": "SECURE-AFK-V1-IHANNSY"
        }
    };

    const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        res.on('end', () => {
             // Silently process
        });
    });
    
    req.on('error', (e) => {
        // Silently process
    });
    
    req.write(payload);
    req.end();
}

module.exports = {
    detectTampering,
    reportUsage
};
