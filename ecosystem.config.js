const path = require('path');
const fs = require('fs');

// Load .env from primary-backend
function loadEnv(envPath) {
  const env = {};
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  } catch (e) {
    console.error('Failed to load .env:', e.message);
  }
  return env;
}

const backendEnv = loadEnv(path.join(__dirname, 'primary-backend', '.env'));

module.exports = {
  apps: [
    {
      name: 'playfi-backend',
      cwd: './primary-backend',
      script: './venv/bin/gunicorn',
      args: 'core.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120 --worker-class gthread --threads 4 --access-logfile - --error-logfile -',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '1024M',
      exp_backoff_restart_delay: 1000,
      max_restarts: 50,
      min_uptime: '10s',
      kill_timeout: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      env: {
        DJANGO_SETTINGS_MODULE: 'core.settings',
        ...backendEnv,
      },
    },
  ],
};
