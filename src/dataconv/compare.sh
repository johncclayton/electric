#!/usr/bin/env bash

set -x
export PYTHONPATH=".:/home/pirate/electric/src/server"
python ./compare.py $*
