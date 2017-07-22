Get Running
===========
You need to check that your equipment satisfies the pre-requisites, and then its just a matter of firing up the software!

Prerequisites
-------------
You should have, or make a shopping list that includes:

 - a Raspberry Pi 3
 - local WIFI network SSID + password
 - a Mac/Windows machine, and terminal/console access to it
 - the USB cable that came with the iCharger (**seriously**, without it you risk frying your Raspberry Pi 3)

Flashing the Raspberry Pi 3
---------------------------
You what?!

Without getting into details (see Development if you want that), we need a thing called "Docker" to run the project.
The standard pi3 linux doesn't have it, so we're going to reflash your Pi3 memory card with a thing called "Hypriot", which does.



This software is distributed as a Docker container - the Raspberry Pi 3 is a great little machine that's capable of running
this technology.

These instructions rely on the Hypriot project to provide the Pi with a fully working Docker sub-system.

To run this, you'll need to have the Pi running, connected to WiFi on your local network, and have terminal/SSH access
to it.  Further instructions on how to do this can be found at the [Hypriot ARM website](https://github.com/hypriot/device-init#the-bootdevice-inityaml).

Assuming you have the IP Address of your Docker capable Raspberry Pi 3, all you need to do is fire up the container that can talk with your iCharger:

  $ docker run -d --privileged -v /dev/bus/usb:/dev/bus/usb  --name electric-pi -p 5000:5000 scornflake/electric-pi

That's it!

Now go get the Ionic 2 App and type in the IP address to your server, you will see the status of your
charger and youre ready to go!
