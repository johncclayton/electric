#!/usr/bin/env bash

[ "root" != "$USER" ] && exec sudo $0 "$@"

shutdown_existing() {
    # Is it running?
    if [ "$(docker ps -q -f name=$1)" ]; then
        echo "$1 is running ... stopping it"
        docker stop $1
    fi
    if [ "$(docker ps -aq -f name=$1)" ]; then
        echo "Removing container $1..."
        docker rm $1
    fi
}

set -e

# If we already have containers, we need to remove them.
shutdown_existing docker-ui
shutdown_existing electric-web
shutdown_existing electric-worker

echo Running with VERSION_TAG=$1, and execute docker-compose up
export VERSION_TAG=":$1"
docker-compose up -d

# TODO: fix this - this is upgrade logic called from the app - check with Neil? 
echo >/opt/LAST_DEPLOY $1

