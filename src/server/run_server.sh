#!/usr/bin/env bash
# do NOT make workers anything other than 1 unless you can solve the "usb bus/icharger is a single resource" problem
gunicorn --reload --pythonpath=.,electric --bind 0.0.0.0:5000 --workers 1 wsgi
