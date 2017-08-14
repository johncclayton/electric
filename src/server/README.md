# development
The development environment can be anything you like, however unit tests can only be run on a Raspberry PI 3 with
a charger connected to it.

# coding, debugging - tools

## Publishing the electric project the PyPi way

Here's the steps - assuming you already have a virtualenv or some Python 2.7 environment ready to go.  You will be
building the package and distributing it to the live PyPi repository. 

    $ sudo apt-get install python-dev cython
    $ pip install twine
    $ cd $HOME
    $ git clone https://github.com/johncclayton/electric.git
    $ cd electric/src/server
 
  
### Configure publish access to the PyPi repo

    $ cp pypirc_template ~/.pypirc
    $ <edit the file in your home directory to reflect your account details / pwd>
  
### Steps to publish to PyPi 

#### Prepare setup.py and decide on a version
PyPi doesn't allow overwrites - if you want to publish, you need to do so to a new version number.  Check the current
PyPi repo for the current version first and then increment based on your change.

The distribute.py script uses the current requirements files and configuration to regenerate a suitable setup.py
which is then run for you.  Twine is assumed as the upload tool; so this must be installed first - which of
course you have already installed, because you absolutely, definately followed the instructions above.  'Course you did! 

The PyPi repo being published to is: https://pypi.python.org/pypi/electric/

Assuming you want to publish to version 0.7.5 - do this:

    $ cd electric/src/server
    $ python scripts/distribute -v 0.7.5 -p
    
Done.  Now anyone can simply run this to install electric:

    $ (sudo) pip install electric
    

## How to run the servers 
When you install electric via PyPi, there are two commands available after installation.

electric-server: this is the web service
electric-worker: this is the zeromq based worker that connects to the charger

You can start them in any order; by default electric-worker listens on 127.0.0.1:5001 for 
instructions.  You can change this by setting environment variables; one for the server to use for its outgoing
connection; one for the worker to use when it binds to its interface.


| Environment Variable | Default Value | Where |
| ---------------------| :------------ | ------
| **ELECTRIC_WORKER** | tcp://127.0.0.1:5001 | electric-server  

Note that on the worker the default is to listen on all interfaces.  

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

Install the dependancies into the virtualenv - on a RPI3 this can take 5 minutes due to cython + hidapi


    $ cd electric
    $ sudo apt-get install libeudev-dev gcc cython cython-dev
    $ pip install hidapi
    $ pip install -r requirements.txt


## Neil's Setting up a fresh Pi3 dev env
### (and John seconds this, but only for Hypriot OS)

Read these instructions all the way through - to the bottom of the file BEFORE beginning - there is useful info everywhere.  

Remember to do the following, so that a user-space program can access the iCharger:
 
 
    echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

Install Hypriot

1. https://github.com/hypriot/flash
1. enable WIFI, log in and edit /boot/device-init.yaml


    wifi:
    interfaces:
      wlan0:
        ssid: "MyNetwork"
        password: "secret_password"

3. get the system updated


    $ sudo apt-get update 
    $ sudo apt-get upgrade
    
4. pull down pip


    $ wget https://bootstrap.pypa.io/get-pip.py
    $ sudo python get-pip.py
    $ sudo pip install virtualenv virtualenvwrapper
    
5. adjust your term to run virtualenvwrapper on login


    $ echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ~/.bashrc 
    
6. logout / log back in (so the shell gets the new virtualenvwrapper stuff)
7. make up a new virtual environment for python


    $ mkvirtualenv electric
    
8. nano ~/.virtualenvs/electric/bin/postactivate, and add "cd ~/electric/src/server"
9. git clone https://github.com/johncclayton/electric.git
10. If you are setting up PyCharm, remember to use 'workon electric' to get the right python path.  
    1. The 'run configuration' will need a source mapping from your dev system to the remote destination 
   path, for example on my Windows machine this is from d:\src\electric => /home/pirate/electric 
    1. In the case above I used hypriot, so double-check the Raspberry Pi path when setting up the Remote Python Interpreter
   and Deployment and Run Configurations.
   
11. Then do the dependency installs - very important to get libusb-dev :
    1. sudo apt-get update
    1. **hypriot**: sudo apt-get install libudev-dev libusb-1.0-0-dev gcc cython cython-dbg
    1. **noobs**: sudo apt-get install libudev-dev libusb-1.0-0.dev gcc cython cython-dev
   
12. the pull in the required python modules


    $ workon electric
    $ pip install hidapi
    $ pip install -r requirements.txt
    
    NOTE - hidapi can take 30 minutes to compile / install, make sure you have libusb-dev installed first

## To run the server
1. ssh pi3 (pi3 is my SSH alias to the pi that I've just setup)


    $ workon electric 
    $ ./run_server.sh --unicorns
    
    or
    
    $ workon electric 
    $ cd ~/electric/src/server 
    $ PYTHONPATH=. sh ./run_server.sh


