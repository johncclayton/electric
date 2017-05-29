#!/bin/bash
IMAGE_NAME="scornflake/electric-pi"
IMAGE_TARFILE="/home/pi/docker_image.tar"
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
    docker image inspect $IMAGE_NAME
    IMAGE_EXISTS=$?
}

while [ $IMAGE_EXISTS -ne 0 ]; do
    image_exists

    if [ $IMAGE_EXISTS -ne 0 ]; then
        echo "Cannot find $IMAGE_NAME image - checking for it in $IMAGE_TARFILE"
        if [ -f "$IMAGE_TARFILE" ]; then
            docker image load -i "$IMAGE_TARFILE" && rm "$IMAGE_TARFILE"
        else 
            have_internet

            if [ $? -eq 0 ]; then
                echo "Still cannot find $IMAGE_NAME image - will try to pull it now..."
                docker pull scornflake/electric-pi
            else
                echo "But gasp, oh no!  There is no internet so I can't pull it..."
            fi
        fi
    fi
done

docker run --rm --privileged --name electric-pi -v /dev/bus/usb:/dev/bus/usb -p 5000:5000 $IMAGE_NAME
