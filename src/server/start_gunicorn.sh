#!/usr/bin/env bash
gunicorn --preload --bind 0.0.0.0:5000 --workers 1 --max-requests=50 --backlog 300 "electric.wsgi:application"
