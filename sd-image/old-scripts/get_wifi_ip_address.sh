#!/usr/bin/env bash
ifconfig wlan0 | grep 'inet addr' | awk -F":" '{print $2;}' | awk '{ print $1; }'