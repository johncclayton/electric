# Development
The development environment can be anything you like, however unit tests can only be run on a Raspberry PI 3 with
a charger connected to it.

# The easy way

## Install

First, you need to install the code and Python packages into their own virtualenv. This is done for you with some scripts.

  1. Flash with Hypriot OS. https://github.com/hypriot/flash
  1. log into the pi
  1. curl --location https://raw.githubusercontent.com/johncclayton/electric/master/development_part_1.sh
  1. curl --location https://raw.githubusercontent.com/johncclayton/electric/master/development_part_2.sh
  1. run development_part_1.sh
  1. relogin to the pi
  1. run development_part_2.sh

## Docker 

Then, you need to ensure docker isn't running the code at the same time, else you won't be able to start your own apps on the pi (the ports will already be in use)


    $ docker ps
    CONTAINER ID        IMAGE                                 COMMAND                  CREATED             STATUS                          PORTS                    NAMES
    416c575e29d1        johncclayton/electric-pi-worker:524   "sh -x /www/run_zm..."   6 weeks ago         Restarting (0) 22 seconds ago                            electric-worker
    b6c6cabb6157        hypriot/rpi-dockerui                  "/dockerui"              6 weeks ago         Up 36 minutes                   0.0.0.0:80->9000/tcp     docker-ui
    42a4eb18bd74        johncclayton/electric-pi-web:524      "sh -x /www/run_gu..."   6 weeks ago   

You need the first part of the container ID's
So, in my case that's 41 b6 42 ... the first 2 chars of each container ID. Then, it's simple!

    $ $ docker stop 41 b6 42
      41
      b6
      42
      HypriotOS/armv7: pirate@black-pearl in /opt
      $ docker ps
      CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES


Note how I did another 'docker ps' above, and nothing is running? That's what you want.

*REMEMBER*: Docker will auto-start the containers. So if you reboot, you need to make sure the containers are stopped again.


## To run the server
1. Use whatever IP address / ssh alias, is right for you
    1. ssh pi3 (pi3 is an ssh alias set in my ~/.ssh/config, not covered here)
    1. workon electric
    1. sudo ./run_zmq_worker
    1. Then, login again in another shell, and: ./run_flask.sh
    
Notes:    
   * run_zmq_worker: starts the process that talks directly to the charger.
   * run_flask: starts the web server that provides a REST API to the charger.  

You need to have both running.

You should now be able to connect to the pi3 and see some output!
Try:  http://pi3:5000/status

That should get you some JSON output.




# The Manual (Hard(er)) Way

Read these instructions all the way through - to the bottom of the file BEFORE beginning - there is useful info everywhere.  I don't recomment this unless you want to experience EVERY single step of the setup.  

Remember to do the following, so that a user-space program can access the iCharger:
 
    echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

## Install Hypriot

1. https://github.com/hypriot/flash

1. get the system updated (this isn't optional btw)


    $ sudo apt-get update 
    $ sudo apt-get upgrade
    $ sudo apt-get install gcc python-dev g++
    
4. pull down + install pip


    $ wget https://bootstrap.pypa.io/get-pip.py
    $ sudo python get-pip.py
    $ sudo pip install virtualenv virtualenvwrapper
    
5. adjust your terminal to run virtualenvwrapper on login


    $ echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ~/.bashrc 
    
6. logout / log back in (so the shell gets the new virtualenvwrapper stuff)

7. make up a new virtual environment for python


    $ mkvirtualenv electric
    
8. auto cd into the electric folder when running 'workon electric'


    $ echo 'cd ~/electric/src/server' >> ~/.virtualenvs/electric/bin/postactivate

9. Get the code: 


    $ git clone https://github.com/johncclayton/electric.git

10. If you are setting up PyCharm, remember to use 'workon electric' to get the right python path.

    1. The 'run configuration' will need a source mapping from your dev system to the remote destination 
   path, for example on my Windows machine this is from d:\src\electric => /home/pirate/electric 
    1. In the case above I used hypriot, so double-check the Raspberry Pi path when setting up the Remote Python Interpreter
   and Deployment and Run Configurations.
   
11. Then do the dependency installs - very important to get libusb-dev :


    $ sudo apt-get update
    $ **hypriot**: sudo apt-get install libudev-dev libusb-1.0-0-dev gcc cython cython-dbg
    $ **noobs**: sudo apt-get install libudev-dev libusb-1.0-0.dev gcc cython cython-dev
   
12. the pull in the required python modules
    1. workon electric
    1. pip install hidapi (**NOTE: hidapi takes about 30 minutes to compile + install**. Make sure you have libusb-dev installed first, this is normally taken care of above, step 11)
    1. pip install -r requirements-worker.txt
    1. pip install -r requirements-web.txt
