# Heroku-style hosts only. Render deploys via the Dockerfile (see render.yaml
# and DEPLOYMENT.md); keep the flags here in step with the Dockerfile CMD.
web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --worker-class gthread --timeout 180 --log-level info
