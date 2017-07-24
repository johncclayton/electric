# status
[![Build Status](https://travis-ci.org/johncclayton/electric.svg?branch=master)](https://travis-ci.org/johncclayton/electric)

Docker image: https://hub.docker.com/r/scornflake/electric-pi/

# What
This project provides everything you need to get information from your iCharger 308/4010 DUO to an application
running on your mobile device.  

# Installation
There are two programs that run on the Raspberry Pi, and one for your phone.

## Server Side - Docker to the Rescue
The server apps run in docker containers.  We chose this path because that provides
us with a repeatable, configured, predictable installation - guaranteed.

To install the server side components, SSH onto your Raspberry Pi - and
do the following:


