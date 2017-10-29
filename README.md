# Build Job Status
[![Build Status](https://travis-ci.org/johncclayton/electric.svg?branch=master)](https://travis-ci.org/johncclayton/electric)

# What is this thing?
Electric is a project that allows you to control your iCharger from your mobile phone (iOS / Android, windows what?) - regardless of whether you are at home or at the field.

This GitHub project provides the server software to control the iCharger 308/406/4010 DUO from a mobile app - and the server software *only* runs on a Raspberry Pi 3.

# So why should I use this?
Well, that's pretty easy to explain - here's our list of unique selling points:
  1. It looks great on your phone.
  1. It's got wow factor - use your iCharger from your deck chair while at the field.
  1. Set up new / existing presets, charge, discharge and store your packs - all from said deck chair.
  1. Use the app at the field as well as on your home WIFI network.

## How do I make it all work?
There are three steps to getting this working: 
  1. Install the software on a Raspberry Pi 3 (this guide).
  1. Set up the networking for the field and your home network (the next guide).
  1. Download the app and enjoy!

## Pictures or it never happened!
Ok - we have that too!

![Demo](/docs/images/teaser.gif "Charge Demo!")

# Supported Platforms
At this time we will only support the Pi3. Nothing else. It's purely so we can focus on dev with a known platform. Supporting other stuff takes time, testing, time... and more time :)  Something we don't have enough of as it is!

# I just want to run this Right Now (tm)
Okay, okay - relax. Take a breath. We hear you.  

There are two major steps.

## Install Hypriot OS Image 
You *must* have a [Hypriot OS image installed](/docs/INSTALL_HYPRIOT.md) onto your Raspberry Pi 3.  

There are lots of ways to scan for devices on your network - I used an app called Net Analyzer, seems to work perfectly well to find the devices.

Once you've flashed the image to the Pi and logged into it via SSH, it's as simple as executing the following line:

    $ curl --location https://raw.githubusercontent.com/johncclayton/electric/master/install-on-rpi3.sh | sudo bash -s
       
The script will do the following:

    - Pull down a Docker Compose file 
    - Install a rule into the OS that exposes the iCharger to user space programs 
    - Download and start the services to connect with the iCharger (via Docker)

Install will begin with downloading of images:
![Downloading the images](/docs/images/downloading-docker-images.png)
When that's done, it'll start services. You won't see much.
![Services being started](/docs/images/docker-compose-up.png)

### Test that the servers are running OK
For this to work you need to have the pi3 on the network, and accessible - which you did anyway right because you just SSH'ed into it. 

Mine at home is called pi3. I have a DNS setup to point to it. I know it's at 192.168.1.30. ymmv.  

 - Visit the server at 5000/unified, like so: http://192.168.1.30:5000/unified.  (you'll need to change the IP, obviously).
![Response](/docs/images/unified-response.png)
If you see something like the above, you've got the server going, congrats!

There's even a colourful flashy dashboard that makes it look like we know what we're doing! This is the same IP, but no port (standard 80). e.g: http://192.168.1.30/
![Response](/docs/images/dashboard.png)


With that done, you should be able to [get the app](/docs/GET_THE_APP.md) going!

# I really want to do all the stuff manually
Check out the README.md in the src/server/ directory - this tells you how to get started as a beta tester.
