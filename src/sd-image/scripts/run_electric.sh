#!/bin/bash

set -x 

IMAGE_NAME_WEB="johncclayton/electric-pi-web"
IMAGE_NAME_WORKER="johncclayton/electric-pi-worker"

IMAGE_TARFILE_WEB="/home/pi/docker_image_web.tar.gz"
IMAGE_TARFILE_WORKER="/home/pi/docker_image_worker.tar.gz"

IMAGE_EXISTS=5

function have_internet() {
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

function image_exists() {
    docker image inspect $1
    IMAGE_EXISTS=$?
}

function unpack_or_fetch() {
    NAME=$1
    TARFILE=$2

    echo "Cannot find image named $NAME - checking for it in tarfile $TARFILE"
    if [ -f "$TARFILE" ]; then
        gunzip -c "$TARFILE" | docker image load && rm "$TARFILE"
    else
        have_internet

        if [ $? -eq 0 ]; then
            echo "Still cannot find image called $1 - will try to pull it now..."
            docker pull $NAME
        else
            echo "But gasp, oh no!  There is no internet so I can't pull it..."
        fi
    fi
}

while [ $IMAGE_EXISTS -ne 0 ]; do
    image_exists $IMAGE_NAME_WEB
    if [ $IMAGE_EXISTS -ne 0 ]; then
        unpack_or_fetch $IMAGE_NAME_WEB $IMAGE_TARFILE_WEB
    fi

    image_exists $IMAGE_NAME_WORKER
    if [ $IMAGE_EXISTS -ne 0 ]; then
        unpack_or_fetch $IMAGE_NAME_WORKER $IMAGE_TARFILE_WORKER
    fi
done

docker-compose up -d

