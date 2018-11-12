#!/usr/bin/env bash
ifconfig $1 | grep 'inet addr' | awk -F":" '{print $2;}' | awk '{ print $1; }'

# for RPI3B+
#ifconfig $1 | grep 'inet.*broadcast' | awk -F" " '{print $2;}' 