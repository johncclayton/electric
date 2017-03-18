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
IMAGE_EXISTS=5

function image_exists() {
    docker image inspect $IMAGE_NAME
    IMAGE_EXISTS=$?
}

while [ $IMAGE_EXISTS -ne 0 ]; do
    image_exists

    if [ $IMAGE_EXISTS -ne 0 ]; then
        echo "Cannot find $IMAGE_NAME image - will pull it now..."
        docker pull scornflake/electric-pi
    fi
done

docker run --rm --privileged --name electric-pi -v /dev/bus/usb:/dev/bus/usb -p 5000:5000 $IMAGE_NAME
