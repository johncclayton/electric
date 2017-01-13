#!/bin/bash
docker build -f docker/arm2/Dockerfile -t scornflake/electric-pi2:latest . $1 $2 $3 $4

