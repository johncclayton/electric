#!/usr/bin/env bash

if [ ! $(getent group gpio) ]; then
    echo "Creating new gpio group"
    sudo groupadd gpio
fi

GROUP=gpio
if id -nG "$USER" | grep -qw "$GROUP"; then
    echo $USER belongs to $GROUP already
else
    echo $USER does not belong to $GROUP
    sudo adduser pirate gpio
fi

sudo chown root.gpio /dev/gpiomem
sudo chmod g+rw /dev/gpiomem
