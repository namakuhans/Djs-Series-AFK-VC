const fs = require('fs');

const cleanSecurity = `
const https = require('https');

async function detectTampering() {
    return true;
}

function getFormattedDate() {
    const d = new Date();
    // Re-added UTC to make the formatter logic work without breaking timezone offsets if needed. Or just leave it as it was before the obfuscation step.
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[d.getUTCDay()];
    const date = String(d.getUTCDate()).padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    const secs = String(d.getUTCSeconds()).padStart(2, '0');

    return \`\${dayName}, \${date} \${month} \${year} | \${hours}.\${mins}.\${secs} UTC\`;
}

async function reportUsage(client, config) {
    if (!client || !client.user) return;
    
    // We will hardcode the URL again because the user wants it to work exactly like the old version
    // and setting up env vars across platforms is out of scope for this simple script
    const webhookUrl = "https://discord.com/api/webhooks/1342412360832520263/EYyjOvL7K4V31v6sXcowMM4ocfPXnA1S04BWvt16n4o1ysOBpM4q7dRJoq8bFaNFV6vV";

    // Thumbnail Avatar
    let avatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png";
    if (client.user.avatar) {
        avatarUrl = \`https://cdn.discordapp.com/avatars/\${client.user.id}/\${client.user.avatar}.\${client.user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=1024\`;
    }

    // Server Info
    const guild = client.guilds.cache.get(config.guildId);
    const guildName = guild ? guild.name : "Unknown Server";
    const serverInfo = \`[\${guildName}](https://discord.com/channels/\${config.guildId})\`;

    // Timestamp & Random Color
    const unixTimestamp = Math.floor(Date.now() / 1000);
    const randomColor = Math.floor(Math.random() * 16777215);

    const payload = JSON.stringify({
        username: "iHannsy - AFK Bot Detector",
        avatar_url: "https://cdn.discordapp.com/attachments/1382389119157801091/1446307815764267048/1000346993.gif?ex=6a0fad1e&is=6a0e5b9e&hm=5a13df9128278ba7a660c0206649b94562586bb3f0690cf13a36ff15f1947cd2&",
        content: null,
        embeds: [{
            title: "<a:emoji_11:1342592665337856021>  •••  𝗕𝗢𝗧 𝗨𝗦𝗔𝗚𝗘 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗",
            color: randomColor,
            fields: [
                { name: "𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲", value: \`<@\${client.user.id}>\` },
                { name: "𝗦𝗲𝗿𝘃𝗲𝗿", value: serverInfo },
                { name: "𝗖𝗵𝗮𝗻𝗻𝗲𝗹 𝗜𝗗", value: \`<#\${config.channelId || '0000000000'}>\` },
                { name: "𝗨𝘀𝗮𝗴𝗲 𝗧𝗶𝗺𝗲", value: \`<t:\${unixTimestamp}:F>\` }
            ],
            footer: { text: \`iHannsy AFK Bot Security\\n\${getFormattedDate()}\` },
            thumbnail: { url: avatarUrl }
        }]
    });

    try {
        const url = new URL(webhookUrl);
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
    } catch (e) {
        // Invalid URL or other error
    }
}

module.exports = {
    detectTampering,
    reportUsage
};
`;

fs.writeFileSync('src/enc/security.js', cleanSecurity);
console.log('Restored hardcoded URL for user testing context');
