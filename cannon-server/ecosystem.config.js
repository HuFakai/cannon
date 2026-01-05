module.exports = {
    apps: [{
        name: 'cannon-server',
        script: 'dist/server.js',
        cwd: '/www/wwwroot/cannon-antigravity/cannon-server',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }]
};
