#!/usr/bin/env bash

set -e

# go get the docker-compose.yml file
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/docker-compose.yml

# get the script to fetch the latest build # from travis
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/get-latest-build-number.py

# and the udev rules?
if [ ! -d "/etc/udev/rules.d/10-icharger.rules" ]; then
    curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/src/server/scripts/10-icharger.rules
    mv 10-icharger.rules /etc/udev/rules.d/ && udevadm control --reload
fi

DOCKER_TAG=`python get-latest-build-number.py`
echo To run this, set DOCKER_TAG to the version you want to run and execute docker-compose up -d