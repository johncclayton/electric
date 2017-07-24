#!/usr/bin/env bash
gunicorn --bind=0.0.0.0:5000 --reload --workers=10 --backlog=300 "electric.wsgi:application"
