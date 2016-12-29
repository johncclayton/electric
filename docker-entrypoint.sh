#!/bin/bash

if [ -d "/server" ]; then
	cd /server
	python -u main.py
fi
