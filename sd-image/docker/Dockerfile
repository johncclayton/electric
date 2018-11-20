#
# This Dockerfile is to be used as follows: 
# 1. Prepare the build environment on a Linux host by using the prepare_container.sh script - you'll need a BRANCH environment value (e.g. master / unified-server or whatever)
# 2. Produce an sd-card image by running the build machine; that's the run_container.sh script. 
#

FROM ubuntu:18.04

# the branch to build, e.g. master 
ARG BRANCH
ENV BRANCH ${BRANCH:-master}

# we'll need some tools
RUN apt-get update && apt-get install -y curl sudo vim zip
WORKDIR /buildkit

# bring down the bootstrapping script - can't run it yet as we'll need priviledged mode and some /dev/loopX devices
RUN chmod 777 /buildkit
RUN curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/sd-image/build-bootstrap.sh && chmod +x build-bootstrap.sh

# the entrypoint will prep the git repo and run the create_image script
COPY docker-entrypoint.sh /
# the publish script is used to copy OUT of the container to somewhere else, in this case it'll copy the image to the /output directory of the container
COPY publish.sh /buildkit 

RUN chmod +x /docker-entrypoint.sh
RUN chmod +x /publish.sh

# the output directory should be mapped somewhere via a bind mount
VOLUME /output

CMD [ "/bin/bash", "/docker-entrypoint.sh" ]