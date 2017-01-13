#!/bin/bash
docker build -f docker/normal/Dockerfile -t scornflake/electric:latest . $1 $2 $3
