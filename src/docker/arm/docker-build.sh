#!/bin/bash

# This should be run from the root volume
docker build -f docker/arm/Dockerfile -t scornflake/electric-pi:latest ./src $1 $2 $3 $4
