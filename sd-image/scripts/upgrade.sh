#!/usr/bin/env bash

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

# go get the docker-compose.yml file
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/docker-compose.yml

VERSION_NUM="$1"

if [ "${VERSION_NUM}x" = "x" ]; then
    # get the script to fetch the latest build # from travis
    curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/development/get-latest-build-number.py

    VERSION_NUM=`python get-latest-build-number.py`
    echo "Latest version is: $VERSION_NUM"
else
    echo "Using specific version $VERSION_NUM"
fi

if [ -f 'LAST_DEPLOY' ]; then
    LAST_DEPLOY=`cat LAST_DEPLOY`
    if [ "$LAST_DEPLOY" -eq "$VERSION_NUM" ]; then
        echo "Up to date. No need to redeploy"
        exit 0
    fi
    echo "Deployed is version: $LAST_DEPLOY... going to stop that and use version: $VERSION_NUM"
fi


# If we already have containers, we need to remove them.
shutdown_existing docker-ui
shutdown_existing electric-web
shutdown_existing electric-worker

echo Running with VERSION_TAG=":$VERSION_NUM", and execute docker-compose up -d
VERSION_TAG=":$VERSION_NUM" docker-compose up -d
echo >/opt/LAST_DEPLOY $VERSION_NUM

