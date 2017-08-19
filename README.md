# status
[![Build Status](https://travis-ci.org/johncclayton/electric.svg?branch=master)](https://travis-ci.org/johncclayton/electric)

Docker image: https://hub.docker.com/r/scornflake/electric-pi/

# What
This project provides everything you need to get information from your iCharger 308/406/4010 DUO to an application
running on your mobile device.  

# Installation
There are two programs that run on the Raspberry Pi, and one app for your phone.

# What now?
Check out the README.md in the src/server/ directory - this tells you how to get started as a beta tester.

# But I just want to run this RIGHT NOW
Okay, okay - we hear you.  

IF you have a basic Hypriot OS based image - then you can pull down the docker images and be ready to start with
just ONE (yes 1) command.

       $ curl --location https://raw.githubusercontent.com/johncclayton/electric/master/install-on-rpi3.sh | sudo bash -s
       
The script will do the following:

    1. Pull down a Docker Compose file to configure/run the services
    1. Install a set of udev rules into the system that will expose the iCharger to user space programs
    1. **WARNING** the services WILL NOT be started, that's up to you
    
After installation, to start the docker services (which may call images to be pulled down):

       $ DOCKER_TAG=332 docker-compose up -d
       
 
