#!/bin/bash

RES=1
while [ $RES -ne 0 ]; do
        ping -c 2 google.com 2>&1 > /dev/null
        RES=$?
        if [ "$RES" -ne 0 ]; then
                echo "Cannot ping google.com - assuming network is down and exiting..."
                exit $RES
        fi
done

IMAGE_NAME="scornflake/electric-pi"
docker image inspect $IMAGE_NAME

RES=$?
if [ "$RES" -ne 0 ]; then
    echo "Cannot find $IMAGE_NAME image"
    exit $RES
fi

docker run --rm --privileged --name electric-pi -v /dev/bus/usb:/dev/bus/usb -p 5000:5000 $IMAGE_NAME
