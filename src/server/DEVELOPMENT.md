# development
The development environment can be anything you like, however unit tests can only be run on a Raspberry PI 3 with
a charger connected to it.

# coding, debugging - tools

## PyCharm Pro

There are a number of things to set up in PyCharm in order to get remote debugging and SSH support.

1. a virtualenv for the development - see the README.md for more info on this
2. check out the source code (duh)
3. set up a PyCharm Remote Python Interpreter
4. set up PyCharm to automatically deploy changes to the PI3 (using the remote you just set up)
5. rejoice - you can now edit/run/debug etc all from within the comfort of PyCharm while running code on an actual device

# setting up a Raspberry Pi for dev
Follow the instructions here to get the standard NOOBS installation running on your PI.

https://www.raspberrypi.org/documentation/installation/noobs.md

Once that's done, you'll need to have the IP address or a keyboard and mouse attached in order to install the
electric software.

The required steps are:

Install virtualenv / git


    $ sudo apt-get install virtualenv git

Create a new python environment (Python 2.7 for now)


    $ virtualenv ~/elec

Activate it


    $ source ~/elec/bin/activate

Clone the source repo


    $ cd $HOME
    $ git clone https://github.com/johncclayton/electric.git

Copy the scripts/10-icharger.rules file so that udevd can ensure the iCharger is accessible from user space and does not require root privs to use.


    $ cd electric
    $ sudo cp src/server/scripts/10-icharger.rules /etc/udev/rules.d/
    $ sudo udevadm control --reload

Install the dependancies into the virtualenv - on a RPI3 this can take 5 minutes due to cython + hdiapi


    $ cd electric
    $ sudo apt-get install libeudev-dev gcc cython cython-dev
    $ pip install hdiapi
    $ pip install -r requirements.txt


## Neil's Setting up a fresh Pi3 dev env
Read these instructions all the way through - to the bottom of the file BEFORE beginning - there is useful info everywhere.  

Remember to do the following, so that a user-space program can access the iCharger:
 
 
    echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

* Install Hypriot
  - https://github.com/hypriot/flash
1. wget https://bootstrap.pypa.io/get-pip.py
1. sudo python get-pip.py
1. sudo pip install virtualenv virtualenvwrapper
1. nano ~/.bashrc and add "source /usr/local/bin/virtualenvwrapper.sh" (without the quotes)
1. logout / log back in (so the shell gets the new virtualenvwrapper stuff)
1. mkvirtualenv electric
1. nano ~/.virtualenvs/electric/bin/postactivate, and add "cd ~/electric/src/server"
1. git clone https://github.com/johncclayton/electric.git
1. If you are setting up PyCharm, remember to use 'workon electric' to get the right python path.  
   1. The 'run configuration' will need a source mapping from your dev system to the remote destination 
   path, for example on my Windows machine this is from d:\src\electric => /home/pirate/electric 
   1. In the case above I used hypriot, so double-check the Raspberry Pi path when setting up the Remote Python Interpreter
   and Deployment and Run Configurations.
1. Then do the dependency installs - very important to get libusb-dev :
   1. sudo apt-get update
   1. **hypriot**: sudo apt-get install libudev-dev libusb-1.0-0.dev gcc cython cython-dev
   1. **noobs**: sudo apt-get install libudev-dev libusb-1.0-0.dev gcc cython cython-dev
1. pip install -r requirements.txt
   1. NOTE - hdiapi can take 30 minutes to compile / install, make sure you have libusb-dev installed first

## To run the server
1. ssh pi3 (pi3 is my SSH alias to the pi that I've just setup)
1. workon electric (to switch to that virtualenv, and auto cd into the electric/server folder)
1. ./run_server.sh --unicorns

