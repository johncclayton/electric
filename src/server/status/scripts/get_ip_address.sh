#!/usr/bin/env bash

. /functions.sh

# TODO: get_ip_address - test on RPI-3B+ and Normal

if [ $IS_RPI_3BPLUS ]; then
    ifconfig $1 | grep 'inet.*broadcast' | awk -F" " '{print $2;}' 
else
    ifconfig $1 | grep 'inet addr' | awk -F":" '{print $2;}' | awk '{ print $1; }'
fi

