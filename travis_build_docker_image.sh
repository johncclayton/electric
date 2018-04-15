docker run --rm --privileged multiarch/qemu-user-static:register --reset
docker login -u="$DOCKER_JC_USER" -p="$DOCKER_JC_PASS"
TAG=$TRAVIS_BUILD_NUMBER
docker build -f docker/arm/Dockerfile-$SERVICE -t johncclayton/electric-pi-$SERVICE .
docker tag johncclayton/electric-pi-$SERVICE johncclayton/electric-pi-$SERVICE:$TAG
docker push johncclayton/electric-pi-$SERVICE