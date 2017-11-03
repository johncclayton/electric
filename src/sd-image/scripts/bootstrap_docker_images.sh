#!/bin/bash

set -x 

# note, no colon before cat output - the version in 
# /opt/compose-command.sh is every so slightly different.
VERSION_TAG=`cat /opt/LAST_DEPLOY`

IMAGE_NAME_WEB="johncclayton/electric-pi-web:${VERSION_TAG}"
IMAGE_NAME_WORKER="johncclayton/electric-pi-worker:${VERSION_TAG}"
IMAGE_NAME_UI="hypriot/rpi-dockerui"

# these only exist during first boot up of the Pi
IMAGE_TARFILE_WEB="/opt/docker_image_web.tar.gz"
IMAGE_TARFILE_WORKER="/opt/docker_image_worker.tar.gz"
IMAGE_TARFILE_UI="/opt/docker_image_ui.tar.gz"

IMAGE_EXISTS=5

have_internet() {
    RES=1
    while [ $RES -ne 0 ]; do
            ping -c 2 google.com 2>&1 > /dev/null
            RES=$?
            if [ "$RES" -ne 0 ]; then
                    echo "Cannot ping google.com - assuming network is down ..."
                    return $RES;
            fi
    done

    return 0;
}

image_exists() {
    docker image inspect $1
    IMAGE_EXISTS=$?
}

unpack_or_fetch() {
    NAME=$1
    TARFILE=$2

    echo "Cannot find image named $NAME - checking for it in tarfile $TARFILE"
    if [ -f "$TARFILE" ]; then
        gunzip -c "$TARFILE" | docker image load && rm "$TARFILE"
    fi
}

WEB_READY=0
WORKER_READY=0
UI_READY=0

while [ $WORKER_READY -eq 0 -o $WEB_READY -eq 0 -o $UI_READY -eq 0 ]; do
    image_exists $IMAGE_NAME_WEB

    WEB_READY=0
    if [ $IMAGE_EXISTS -ne 0 ]; then
        unpack_or_fetch $IMAGE_NAME_WEB $IMAGE_TARFILE_WEB
    else
        WEB_READY=1
    fi

    WORKER_READY=0
    image_exists $IMAGE_NAME_WORKER
    if [ $IMAGE_EXISTS -ne 0 ]; then
        unpack_or_fetch $IMAGE_NAME_WORKER $IMAGE_TARFILE_WORKER
    else
        WORKER_READY=1
    fi

    UI_READY=0
    image_exists $IMAGE_NAME_UI
    if [ $IMAGE_EXISTS -ne 0 ]; then
        unpack_or_fetch $IMAGE_NAME_UI $IMAGE_TARFILE_UI
    else    
        UI_READY=1
    fi

    sleep 5
done

# does not exit
cd /opt && ./compose-command.sh
