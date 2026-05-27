module.exports = {
  apps: [
    {
      name: 'tickets',
      cwd: '/var/www/tickets',
      script: 'server/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
