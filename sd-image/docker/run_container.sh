#!/bin/bash

if [ -z "$BRANCH" ]; then
	echo "I can't detect the name of the branch - aborting..."
	exit 13
fi

if [ -z "$TRAVIS_BUILD_NUMBER" ]; then
	echo "I can't detect the TRAVIS_BUILD_NUMBER - aborting..."
	exit 13
fi

OUTPUT=$PWD/final-$TRAVIS_BUILD_NUMBER
if [ -d "$OUTPUT" ]; then
    rm -rf "$OUTPUT"
fi

mkdir -p $OUTPUT

docker run -it --privileged=true --rm --mount type=bind,source=$OUTPUT,target=/output electric-build:latest

echo "TADAAAAA: the final image is now available here: $OUTPUT"