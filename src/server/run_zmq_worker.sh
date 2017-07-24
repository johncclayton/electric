#!/bin/bash
export PYTHONPATH=.
watchmedo auto-restart -p "*.py;*.txt" --recursive "python electric/worker/worker.py"

