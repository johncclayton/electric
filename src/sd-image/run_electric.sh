#!/bin/bash
docker run --rm --privileged -v /dev/bus/usb:/dev/bus/usb -p 5000:5000 scornflake/electric-pi
