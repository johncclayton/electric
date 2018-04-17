#!/usr/bin/env bash
ifconfig $1 | grep 'inet ' | awk -F" " '{print $2;}' | awk '{ print $1; }'