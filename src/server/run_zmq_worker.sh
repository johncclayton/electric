#!/bin/bash
BASHSOURCE=$0
DIR="$( cd "$( dirname "$BASHSOURCE" )" && pwd )"
export PYTHONPATH=$DIR
#watchmedo auto-restart -p "*.py;" --recursive python electric/worker/worker.py
[ ! -d /opt/prefs ] && (rm -Rf /opt/prefs; mkdir -p /opt/prefs)
python electric/worker/worker.py
