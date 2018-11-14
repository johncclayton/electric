#!/bin/bash

function find_loopback() {
    N=0
    FOUND=0
    while [ $FOUND -ne 0 ]; do
        echo "trying $N..."
        sudo losetup /dev/loop$N
        FOUND=$?
        N=$((N + 1))
        echo "will try $N now..."
        sleep 1
    done

    echo $N
}

echo `find_loopback`