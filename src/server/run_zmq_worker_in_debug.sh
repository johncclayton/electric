#!/bin/bash
BASHSOURCE=$0
DIR="$( cd "$( dirname "$BASHSOURCE" )" && pwd )"
export PYTHONPATH=$DIR:debug/pycharm-debug.egg

#watchmedo auto-restart -p "*.py;" --recursive python electric/worker/worker.py
python electric/worker/debug_worker.py