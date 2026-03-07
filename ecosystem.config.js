module.exports = {
  apps: [
    {
      name: 'playfi-backend',
      cwd: './primary-backend',
      script: './venv/bin/gunicorn',
      args: 'core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120 --worker-class gthread --threads 4',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_memory_restart: '1024M',
      env: {
        DJANGO_SETTINGS_MODULE: 'core.settings',
      },
    },
    {
      name: 'playfi-worker',
      cwd: './worker',
      script: './venv/bin/python',
      args: 'worker.py',
      interpreter: 'none',
      instances: 3,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
