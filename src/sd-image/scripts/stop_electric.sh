#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
$DIR/check_docker_container.sh electric-pi
RES=$?
if [ $RES -le 2 ]; then
	/usr/bin/docker rm -f electric-pi
fi
