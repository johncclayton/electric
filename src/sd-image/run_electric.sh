#!/bin/bash
docker run --rm --privileged --name electric-pi -v /dev/bus/usb:/dev/bus/usb -p 5000:5000 scornflake/electric-pi
