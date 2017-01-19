#!/usr/bin/env bash
docker run --restart=always -d --name eletric-pi --privileged -v /dev/bus/usb:/dev/bus/usb -v $PWD/src/electric:/www -p 5000:5000 scornflake/electric-pi

