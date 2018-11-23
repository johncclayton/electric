#!/usr/bin/env bash
BASHSOURCE=$0
DIR="$( cd "$( dirname "$BASHSOURCE" )" && pwd )"
export PYTHONPATH=$DIR

if [ -x /opt/gpio.sh ]; then
    /opt/gpio.sh
fi

gunicorn --bind=0.0.0.0:5000 --reload --workers=3 --backlog=300 "electric.wsgi:application"