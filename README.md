# Build Job Status
[![Build Status](https://travis-ci.org/johncclayton/electric.svg?branch=master)](https://travis-ci.org/johncclayton/electric)

# What is this thing?
This project provides everything you need to get information from your iCharger 308/406/4010 DUO to an application
running on your mobile device.  

# I really want to do all the stuff manually
Check out the README.md in the src/server/ directory - this tells you how to get started as a beta tester.

# I just want to run this Right Now (tm)
Okay, okay - relax. Take a breath. We hear you.  

You *must* have a [Hypriot OS image installed](/docs/INSTALL_HYPRIOT.md) onto your Raspberry Pi 3 - then it's as simple as:

       $ curl --location https://raw.githubusercontent.com/johncclayton/electric/master/install-on-rpi3.sh | sudo bash -s
       
The script will do the following:

    1. Pull down a Docker Compose file to configure/run the services
    1. Install a set of udev rules into the system that will expose the iCharger to user space programs
    1. Startup the services

Install will begin with downloading of images:
![Downloading the images](/docs/images/downloading-docker-images.png)

When that's done, it'll start services. You won't see much.

![Services being started](/docs/images/docker-compose-up.png)

