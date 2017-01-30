# status
[![Build Status](https://travis-ci.org/johncclayton/electric.svg?branch=master)](https://travis-ci.org/johncclayton/electric)

Docker image: https://hub.docker.com/r/scornflake/electric-pi/

# what
This project provides everything you need to get information from your iCharger 308/4010 DUO to an application 
running on your mobile device.

# how
You will need the following:

 1. iCharger 308, 408 or 4010 DUO
 1. The mini-USB cable provided with the charger (don't use anything else)
 1. A Raspberry PI 3 with Docker installed (Hypriot ARM To The Rescue!)

Warning 1: **seriously**, don't use anything other than the USB cable provided with the iCharger - there are known cases
 of the iCharger frying motherboards (in this case your Pi).  You have been warned.

Warning 2: ** MORE SERIOUSLY **, the authors take no liability for any damages. Always be near your charger
when charging batteries.  We've made every attempt to create reliable and smart software, but
we accept no responsibility if it deletes all your settings, sets fire to your cat, and steals your cookies.
aka: Make a backup of your settings! (Charger Setup | Save & Load Config | Save to SD Card)

To run this, you'll need to have the Pi running, connected to WiFi on your local network, and have terminal/SSH access 
to it.  Further instructions on how to do this can be found at the [Hypriot ARM website](https://github.com/hypriot/device-init#the-bootdevice-inityaml).  

Assuming you have the IP Address of your Docker capable Raspberry Pi 3, all you need to do is fire up the container that can talk with your iCharger: 

    $ docker run -d --privileged -v /dev/bus/usb:/dev/bus/usb  --name electric-pi -p 5000:5000 scornflake/electric-pi 

That's it!  

Now go get the Ionic 2 App and type in the IP address to your server, you will see the status of your
charger and youre ready to go!

# why
One day I was staring at my iCharger thinking: it'd be cool if I could get a notification when the charge cycle 
for my LiPo packs has completed.  

That was the start of this project.  

My brother and I fly RC model helis.  The hobby is complex, interesting, fun and has a fantastic community.  
We're involved in I.T. - and we figured we can use our skills to build something useful and give it back to everyone 
in the community and beyond. 
 
