#!/usr/bin/env bash
export PYTHONPATH=.

## This is the default for now, the most reliable
## Note: if DEBUG_MODE is set, rest_interface will create a ChargerCommsManager without locking
## which is fine, since Flask does single threaded access.
#echo "Starting in DEBUG mode using flask, zero unicorns and no RQ"
export DEBUG_MODE=1
python main.py




