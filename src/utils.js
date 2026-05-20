
// Store configuration in-memory instead of writing to disk
let runtimeConfig = { token: '', guildId: '', channelId: '', useRpc: true };

function readConfig() {
  return { ...runtimeConfig };
}

function writeConfig(config) {
  runtimeConfig = { ...runtimeConfig, ...config };
}

module.exports = {
  readConfig,
  writeConfig
};
