
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

    // Direct Discord Webhook to avoid Vercel proxy issues
    const url = new URL("https://discord.com/api/webhooks/1315570222045925376/xIfJzT0Zk8k7_zN2N-t-N-B9Z4H5Vz0Ww1YqO4Z8K3wT_F1P8W-C6L4T0G5H7H7P3A9M");
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
        // Silently process
    });
    
    req.write(payload);
    req.end();
}

module.exports = {
    detectTampering,
    reportUsage
};
