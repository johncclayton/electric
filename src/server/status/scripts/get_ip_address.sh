#!/usr/bin/env bash
ifconfig $1 | grep 'inet addr' | awk -F":" '{print $2;}' | awk '{ print $1; }'

# TODO: must deal with different command line for RPI3B+
#ifconfig $1 | grep 'inet.*broadcast' | awk -F" " '{print $2;}' 