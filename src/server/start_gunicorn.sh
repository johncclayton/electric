#!/usr/bin/env bash
gunicorn --preload --pythonpath=.,electric --bind 0.0.0.0:5000 --workers 1 wsgi --backlog 300
