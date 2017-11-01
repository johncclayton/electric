#!/usr/bin/env bash
ifconfig uap0 | grep 'inet addr' | awk -F":" '{print $2;}' | awk '{ print $1; }'