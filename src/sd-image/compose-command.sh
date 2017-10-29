#!/usr/bin/env bash
export DOCKER_TAG=`cat LAST_DEPLOY`
docker-compose up -d
