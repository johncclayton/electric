# Build Job Status
[![Build Status](https://travis-ci.org/johncclayton/electric.svg?branch=master)](https://travis-ci.org/johncclayton/electric)

# What is this thing?
This project provides everything you need to get information from your iCharger 308/406/4010 DUO to an application
running on [your mobile device](/docs/GET_THE_APP.md).

# I really want to do all the stuff manually
Check out the README.md in the src/server/ directory - this tells you how to get started as a beta tester.

# I just want to run this Right Now (tm)
Okay, okay - relax. Take a breath. We hear you.  

You *must* have a [Hypriot OS image installed](/docs/INSTALL_HYPRIOT.md) onto your Raspberry Pi 3 - then it's as simple as:

    $ curl --location https://raw.githubusercontent.com/johncclayton/electric/master/install-on-rpi3.sh | sudo bash -s
       
The script will do the following:

    - Pull down a Docker Compose file to configure/run the services
    - Install a set of udev rules into the system that will expose the iCharger to user space programs
    - Startup the services

Install will begin with downloading of images:
![Downloading the images](/docs/images/downloading-docker-images.png)

When that's done, it'll start services. You won't see much.
![Services being started](/docs/images/docker-compose-up.png)


Now test the server is OK.
For this to work you need to have the pi3 on the network, and accessible. Mine at home is called pi3. I have a DNS setup to point to it. I know it's at 192.168.1.30. ymmv.

 - Visit the server at 5000/unified, like so: http://192.168.1.30:5000/unified.  (you'll need to change the IP, obviously).
![Response](/docs/images/unified-response.png)
If you see something like the above, you've got the server going, congrats!

There's even a colourful flashy dashboard that makes it look like we know what we're doing! This is the same IP, but no port (standard 80). e.g: http://192.168.1.30/
![Response](/docs/images/dashboard.png)


With that done, you should be able to [get the app](/docs/GET_THE_APP.md) going!