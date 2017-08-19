# Beta Testing

***WARNING*** OUT OF DATE AND NEEDS TO BE UPDATED

This second is devoted to getting you up & running as a BETA tester.  

You will need a Raspberry Pi 3, some terminal skills, connectivity to Mr Internet and about 45 minutes :-) 

## Prepare the Raspberry Pi 3
Read these instructions all the way through - to the bottom of the file BEFORE beginning - there is useful info everywhere.  

Remember to do the following, so that a user-space program can access the iCharger:
  
    echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

## Install the Hypriot Image

Go an grab their flashing tool from here: https://github.com/hypriot/flash

Install the OS, and log into it via terminal / SSH. 

## Configure WIFI and Update via APT

1. Enable WIFI, log in and edit /boot/device-init.yaml

       wifi:
         interfaces:
           wlan0:
             ssid: "MyNetwork"
             password: "secret_password"

1. get the system updated

       $ sudo apt-get update 
       $ sudo apt-get upgrade
       $ sudo apt-get install gcc g++ python-dev

## Install the Electric codebase using PyPi

1. pull down pip
       
       $ wget https://bootstrap.pypa.io/get-pip.py
       $ sudo python get-pip.py

1. install electric from PyPi 

       $ sudo pip install electric
       
**WARNING** this can take about 45 minutes - because it will cause hidapi and zeromq compilation jobs.  And the Pi 
is very slow with compiling.  Very very slow.  

## To run the server

1. Run a Terminal then type:

       $ electric-worker
    
1. Run another Terminal and type: 

       $ electric-server

## Get Ionic View 

We distribute testing versions of the iOS/Android apps using Ionic View.  Head on over to https://ionic.io/ and sign
up then pull down the Ionic View app from the appropriate app store. 

You will need to add our app to your Ionic View installation, use the menu option "Preview an app" and type in the 
following app ID:

       f944cad8
       
