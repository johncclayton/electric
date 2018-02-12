# Development
* Useful if you want *really* fast debugging because you can setup remote debugging directly to a connected charger. That means you can code + set breakpoints. Whew! 
* __Warning__: takes a bit of time to setup, but if you're serious about development, it's so so worth it. Rebuilding and re-deploying docker containers (the alternative) is no fun at all.
* Unit tests can only be run on a Raspberry PI 3 with
a charger connected to it.

# The easy(ish) way

## Install

First, you need to install the code and Python packages into their own virtualenv. This is done for you with some scripts.

  1. Flash with Hypriot OS. https://github.com/hypriot/flash
  1. log into the pi
  1. curl -O --location https://raw.githubusercontent.com/johncclayton/electric/master/development/development_part_1.sh
  1. curl -O --location https://raw.githubusercontent.com/johncclayton/electric/master/development/development_part_2.sh
  1. run development_part_1.sh
  1. relogin to the pi
  1. run development_part_2.sh


# To run the server

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

## Start worker and the webserver
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
Try:  http://pi3:5000/unified

That should get you some JSON output.

## Auto deploy code from PyCharm -> your pi

This requires the setup of SSH from your development machine to your Pi3.

Assumptions:
- This document assumes the use of a Mac with existing SSH keys.
- After all, you've SSHed into the pi3 already right? You have keys setup? (er, I hope so!)

What you'll need:

- 10m
- Some patience
- The SSH keys

Here goes!

We're going to setup what in Pycharm is known as a "Deployment".

  1. Go to 'Deployment'
  1. Add a new one using the '+' symbol in the lists toolbar
  1. Select SFTP as the type
  1. Host is whatever your pi3 IP address is (mine has a DNS entry, pi3. Yours might be .... 192.168.1.10, for example)
  1. Port is 22
  1. Root path is __the full path to the server code__, /home/pirate/electric/src/server
  1. Username: pirate
  1. Auth type is OpenSSH/Putty
  1. Private key file: Point to your private key file here
  1. __TEST THE CONNECTION__ (hit the button). It should work.

![Pycharm Deployment](/docs/images/dev/Pycharm_Deployment.png)

Go to Mappings (next tab)

  1. Just enter the full path of the source
  1. And the the next two fields are just /

![Mappings](/docs/images/dev/Pycharm_Mappings.png)

I figure you can prob set it up with user/pass as well, I've just never done that... I've always used the pub/private key method.

## Remote Debugging

- TODO
- SSH setup
- Pycharm configuration



