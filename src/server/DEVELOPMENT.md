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


## Neil's Setting up a fresh Pi3 using Hypriot from scratch
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

## To run the server
1. ssh pi3 (pi3 is my SSH alias to the pi that I've just setup)
1. workon electric (to switch to that virtualenv, and auto cd into the electric/server folder)
1. ./run_server.sh

