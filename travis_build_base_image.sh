echo "The build number is: $TRAVIS_BUILD_NUMBER"
echo "The docker user is: $DOCKER_JC_USER"

# OK. Get the requirements file from which the image is built.
# Test to see if it's changed.

echo "Making this FAST..."
echo docker run --rm --privileged multiarch/qemu-user-static:register --reset
echo docker login -u="$DOCKER_JC_USER" -p="$DOCKER_JC_PASS"
echo docker build -f docker/arm/Dockerfile-base -t johncclayton/electric-pi-base .
echo docker push johncclayton/electric-pi-base

