#!/bin/bash
docker build -f ./Dockerfile-arm -t scornflake/electric-pi:latest . $1 $2 $3 $4

