#!/usr/bin/env bash
export PYTHONPATH=.
#python electric/main.py
gunicorn --reload --pythonpath=.,electric --bind 0.0.0.0:5000 --workers 5 wsgi --backlog 400
