#!/bin/bash

#
# This is a combination of building the docker image and initialising it (via a run with --priv).  
#
# The distinction is important because it isn't possible to map /dev/loopX 
# devices during build - so producing an sd-image must be done in two stages. 
#

if [ -z "$TRAVIS_BRANCH" ]; then
	echo "I can't detect the name of the branch - aborting..."
	exit 13
fi

# TRAVIS_BRANCH is required because the build stage pulls the build-bootstrap scripts from source control
docker build --build-arg TRAVIS_BRANCH="$TRAVIS_BRANCH" -t electric-build-${TRAVIS_BRANCH}:basic .
R=$?

if [ $R -eq 0 ]; then
    docker rm electric-build-${TRAVIS_BRANCH}-basic
    docker run --privileged=true --name electric-build-${TRAVIS_BRANCH}-basic electric-build-${TRAVIS_BRANCH}:basic /buildkit/build-bootstrap.sh
    docker commit electric-build-${TRAVIS_BRANCH}-basic electric-build-${TRAVIS_BRANCH}:latest
    echo "SUCCESS: use the run_container.sh to produce an sd card image using Docker!"
else
    echo "FAILED: there was an error preparing the Docker image"
fi
