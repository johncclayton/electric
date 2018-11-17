FROM ubuntu:18.04

RUN apt-get update && apt-get install -y sudo curl

# this will require: --cap-add SYS_ADMIN  --device /dev/loop0 --device /dev/loop1 --device /dev/loop2 --device /dev/loop4 --device /dev/loop5 --device /dev/loop-control

# note: the entire Dockerfile concept does not work yet as I've not tried it on a Linux machine with /dev/loop devices

RUN curl -sL https://raw.githubusercontent.com/johncclayton/electric/unified-server/sd-image/build-bootstrap.sh > setup.sh
RUN chmod +x setup.sh
RUN ./setup.sh

ENTRYPOINT [ "/bin/bash" ]
