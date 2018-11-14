#!/bin/bash

LOOPBACK=0

function find_loopback() {
    N=-1
    FOUND=0
    while [ $FOUND -eq 0 ]; do
        N=$((N + 1))
        sudo losetup /dev/loop${N}
        FOUND=$?
    done

    if [ $FOUND -eq 1 ]; then
        LOOPBACK=$N
    else
        LOOPBACK=-1
    fi
}

find_loopback

echo "Got it: try /dev/loop${LOOPBACK}"