# Installing

This second is devoted to getting you up & running with your Pi.  

You will need a Raspberry Pi 3, some terminal skills, connectivity to Mr Internet and about 45 minutes :-) 

The first part of these instructions covers installing the s/ware via PyPi - at the end you'll find
more about how to generate the setup.py files and publish to PyPi. 

## Prepare the Raspberry Pi 3 (or 3B+)

Read these instructions all the way through - to the bottom of the file BEFORE beginning - there is useful info everywhere.  

Remember to do the following, so that a user-space program can access the iCharger:
  
    echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

## Install the Raspbian Image

Grab the latest/greatest Raspbian image from Mr Internet. 

Install the OS, and log into it via terminal / SSH. 

## Configure WIFI and Update via APT

1. get the system updated

       $ sudo apt-get update 
       $ sudo apt-get upgrade

## Install the Electric codebase using PyPi (Raspbian Jessie / Nov 2018)

1. install all the dependancies
       
       $ sudo apt-get install linux-headers-rpi libusb-1.0-0-dev libudev-dev python-pip gcc cython

1. install electric from PyPi 

       $ sudo pip install electric
       
**WARNING** this can take about 45 minutes - because it will cause hidapi and zeromq compilation jobs.  And the Pi is very slow with compiling.  Very very slow.  

## To run the server

1. Run a Terminal then type:

       $ electric-worker-cmd
    
1. Run another Terminal and type: 

       $ electric-server-cmd

# Publish to PyPi

Create a new virtualenv and install the requirements-pypi.txt into it.  This is basically just Jinga
for templating and twine to upload to the PyPi system.

You will need a .pypirc file to set up the repository configuration before publishing.  There
is a sample file called pypirc_template you can use for this purpose. 

## Generating setup.py
Before publishing you'll need to generate the setup.py, this is done as follows:


    # python scripts/distrbute.py --generate

Now that you have the right setup.py you can publish to the *test* network to ensure things look good. 


    # python scripts/distribute.py --publish 

    