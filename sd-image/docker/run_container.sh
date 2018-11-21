#!/bin/bash

if [ -z "$TRAVIS_BRANCH" ]; then
	echo "I can't detect the name of the branch - aborting..."
	exit 13
fi

if [ -z "$TRAVIS_BUILD_NUMBER" ]; then
	echo "I can't detect the TRAVIS_BUILD_NUMBER - aborting..."
	exit 14
fi

OUTPUT=$PWD/final-$TRAVIS_BUILD_NUMBER
if [ -d "$OUTPUT" ]; then
    rm -rf "$OUTPUT"
fi

mkdir -p $OUTPUT

docker run -e "TRAVIS_BRANCH=${TRAVIS_BRANCH}" -e "TRAVIS_BUILD_NUMBER=$TRAVIS_BUILD_NUMBER" --privileged=true --rm --mount type=bind,source=$OUTPUT,target=/output electric-build-${TRAVIS_BRANCH}:latest /docker-entrypoint.sh

echo "TADAAAAA: the final image is now available here: $OUTPUT"
