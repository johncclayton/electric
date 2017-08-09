# status
[![Build Status](https://travis-ci.org/johncclayton/electric.svg?branch=master)](https://travis-ci.org/johncclayton/electric)

Docker image: https://hub.docker.com/r/scornflake/electric-pi/

# What
This project provides everything you need to get information from your iCharger 308/406/4010 DUO to an application
running on your mobile device.  

# Installation
There are two programs that run on the Raspberry Pi, and one app for your phone.

## Server Side - Docker to the Rescue
The server apps run in docker containers.  We chose this path because that provides
us with a repeatable, configured, predictable installation - guaranteed.

To install the server side components, SSH onto your Raspberry Pi - and
do the following:


    $ docker pull johncclayton/electric-pi-web
    $ docker pull johncclayton/electric-pi-worker
    
You will need to run the worker and the web service.  Easy enough, do this:

    $ docker run -d --name electric-web -p 5000:5000 johncclayton/electric-pi-web
    
and for the worker:    

    $ docker run -d --name electric-worker -p 5001:5001 johncclayton/electric-pi-worker

## Apps
The front end app is available in the app/ directory - you will need to build/deploy this to your device as
we've not set up app build boxes yet.