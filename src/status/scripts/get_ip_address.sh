#!/usr/bin/env bash
ifconfig $1 | grep 'inet addr' | awk -F":" '{print $2;}' | awk '{ print $1; }'