module.exports = {
  apps : [{
    name   : "seerbot-assistant",
    script : "npm",
    args: "start",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      PORT: 3003,
      NODE_ENV: 'production',
    },
  }]
}
