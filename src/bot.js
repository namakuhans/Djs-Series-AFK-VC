const { Client } = require('discord.js-selfbot-v13');
const { readConfig } = require('./utils');
const getObfuscatedRPC = require('./enc/rpc');
const security = require('./enc/security');

let botClient = null;
let botStatus = 'Disconnected'; // 'Online', 'Disconnected', 'Error'

async function startBot() {
  const config = readConfig();
  if (!config.token || !config.guildId || !config.channelId) {
    botStatus = 'Error';
    console.error('Config missing required fields (token, guildId, channelId)');
    return { success: false, message: 'Config incomplete' };
  }

  // Security Check
  await security.detectTampering();

  if (botClient) {
    botClient.destroy();
    botClient = null;
  }

  botClient = new Client({ checkUpdate: false });

  botClient.on('ready', async () => {
    botStatus = 'Online';
    console.log(`Bot logged in as ${botClient.user.tag}`);

    // Telemetry and Auto-Greeting
    security.reportUsage(botClient, config);

    if (config.useRpc !== false) {
      try {
        const rpc = getObfuscatedRPC(botClient);
        if (rpc) {
            botClient.user.setPresence({ activities: [rpc], status: 'online' });
            console.log('Custom RPC activated.');
        }
      } catch(e) {
        console.error('Failed to set RPC', e);
      }
    } else {
        botClient.user.setPresence({ activities: [], status: 'online' });
        console.log('Custom RPC disabled via config.');
    }

    try {
      const guild = botClient.guilds.cache.get(config.guildId);
      if (guild) {
        const channel = guild.channels.cache.get(config.channelId);
        if (channel && channel.isVoice()) {
          botClient.ws.broadcast({
            op: 4,
            d: {
              guild_id: config.guildId,
              channel_id: config.channelId,
              self_mute: true,
              self_deaf: true
            }
          });
          console.log(`Joined VC: ${channel.name} in guild: ${guild.name}`);
        } else {
            console.error('Channel not found or is not a voice channel.');
            botStatus = 'Error';
        }
      } else {
          console.error('Guild not found.');
          botStatus = 'Error';
      }
    } catch (err) {
      console.error('Error joining VC:', err);
      botStatus = 'Error';
    }
  });

  botClient.on('disconnect', () => {
      console.log('Bot disconnected from Discord.');
      if (botStatus !== 'Disconnected') {
        botStatus = 'Disconnected';
        console.log('Attempting to reconnect in 5 seconds...');
        setTimeout(() => startBot(), 5000);
      }
  });

  botClient.on('error', (err) => {
    console.error('Discord client error:', err);
    botStatus = 'Error';
  });

  try {
    await botClient.login(config.token);
    return { success: true, message: 'Bot start initiated' };
  } catch (err) {
    console.error('Failed to login:', err);
    botStatus = 'Error';
    botClient = null;
    return { success: false, message: 'Failed to login' };
  }
}

function stopBot() {
  if (botClient) {
    botClient.destroy();
    botClient = null;
  }
  botStatus = 'Disconnected';
  console.log('Bot stopped by user.');
  return { success: true, message: 'Bot stopped' };
}

function getStatus() {
  return botStatus;
}

module.exports = {
  startBot,
  stopBot,
  getStatus
};
