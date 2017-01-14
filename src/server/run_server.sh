#!/usr/bin/env bash
export PYTHONPATH=.

for i in "$@" ; do
    if [[ $i == "--debug" ]] ; then
        echo "Starting in DEBUG mode using flask, zero unicorns and no RQ"
        export DEBUG_MODE=1
        python electric/main.py
        exit
    fi
done

echo "Starting with many unicorns..."
gunicorn --reload --pythonpath=.,electric --bind 0.0.0.0:5000 --workers 5 wsgi --backlog 400
