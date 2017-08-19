#!/usr/bin/env bash

set -e

# go get the docker-compose.yml file
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/docker-compose.yml

# and the udev rules?
if [ ! -d "/etc/udev/rules.d/10-icharger.rules" ]; then
    curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/src/server/scripts/10-icharger.rules
    mv 10-icharger.rules /etc/udev/rules.d/ && udevadm control --reload
fi

echo To run this, set DOCKER_TAG to the version you want to run and execute docker-compose up -d