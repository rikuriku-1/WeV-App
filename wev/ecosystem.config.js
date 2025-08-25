export default {
  apps: [
    {
      name: 'wev-dev-server',
      script: 'npm',
      args: 'run dev -- --host --port 3000',
      cwd: '/home/user/webapp/wev',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '5s',
      log_file: './logs/combined.log',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      time: true
    }
  ]
}