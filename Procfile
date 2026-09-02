# Serves the JSON API and the built React SPA from client/dist.
# Note: the frontend must be built first (see scripts/build.sh).
web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --worker-class gthread --timeout 180 --log-level info
