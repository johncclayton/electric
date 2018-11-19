#!/bin/bash

# https://www.raspberrypi-spy.co.uk/2012/09/checking-your-raspberry-pi-board-version/

export IS_RPI_3BPLUS=0

grep 'Raspberry Pi 3 Model B Plus' /proc/device-tree/model
if [ $? -eq 0 ]; then
    IS_RPI_3BPLUS=1
fi
