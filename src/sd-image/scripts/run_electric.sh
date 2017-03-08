#!/bin/bash

RES=1
while [ $RES -ne 0 ]; do
        echo "Checking for network presence..."
        ping -c 2 google.com 2>&1 > /dev/null
        RES=$?
        if [ "$RES" -ne 0 ]; then
                echo "Cannot ping google.com - assuming network is down and exiting..."
                exit $RES
        fi
done

echo "Pulling electric-pi image..."
docker pull scornflake/electric-pi

echo "Running service..."
docker run --rm --privileged --name electric-pi -v /dev/bus/usb:/dev/bus/usb -p 5000:5000 scornflake/electric-pi
