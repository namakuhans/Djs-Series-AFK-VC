const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config.json');

function readConfig() {
  if (!fs.existsSync(configPath)) {
    return { token: '', guildId: '', channelId: '', useRpc: true };
  }
  const data = fs.readFileSync(configPath, 'utf8');
  try {
    const config = JSON.parse(data);
    // ensure useRpc is boolean, default to true if undefined
    if (typeof config.useRpc !== 'boolean') {
        config.useRpc = true;
    }
    return config;
  } catch (err) {
    return { token: '', guildId: '', channelId: '', useRpc: true };
  }
}

function writeConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  readConfig,
  writeConfig
};
