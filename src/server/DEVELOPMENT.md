# development
The development environment can be anything you like, however unit tests can only be run on a Raspberry PI 3 with 
a charger connected to it.

# coding, debugging - tools
Use PyCharm Pro.

There are a number of things to set up in order to obtain development nirvana.

1. a virtualenv for the development - see the README.md for more info on this
2. check out the source code (duh)
3. set up a PyCharm Remote Python Interpreter
4. set up PyCharm to automatically deploy changes to the PI3
5. rejoice - you can now edit/run/debug etc all from within the comfort of PyCharm while running code on an actual device

# enough already - what are the steps?
Follow the instructions here to get the standard NOOBS installation running on your PI.

https://www.raspberrypi.org/documentation/installation/noobs.md

Once that's done, you'll need to have the IP address or a keyboard and mouse attached in order to install the 
electric software.

Steps: 

1. Install virtualenv / git

    $ sudo apt-get install virtualenv git
    
2. Create a new python environment (Python 2.7 for now)

    $ virtualenv ~/elec
    
3. Activate it

    $ source ~/elec/bin/activate
    
4. Clone the source repo

    $ cd $HOME
    $ git clone https://github.com/johncclayton/electric.git
    
5. Copy the scripts/10-icharger.rules file so that udevd can ensure the iCharger is accessible from user space and does not require root privs to use.
 
    $ cd electric 
    $ sudo cp src/server/scripts/10-icharger.rules /etc/udev/rules.d/
    $ sudo udevadm control --reload
    
6. Run the server to test that it can be used.

    $ cd src/server && ./run_server.sh
    

