# Development
* Useful if you want *really* fast debugging because you can setup remote debugging directly to a connected RPI3/charger combo. That means you can code + set breakpoints. Whew! 
* Unit tests can only be run on a Raspberry PI 3 with a charger connected to it.
* You get to code on a real computer, sync that to the RPI3 and still stay sane.

# The easy(ish) way

## Prepare

First, you need to install the code and Python packages into their own virtualenv. This is done for you with some scripts.

  1. Flash an SD card with a standard Raspbian Lite image. 
  1. log into the pi (user: pi, password: raspberry)
  1. then get the ball rolling by bootstrapping the whole thing... run the command below
  
    $ bash <(curl -Ls https://raw.githubusercontent.com/johncclayton/electric/master/development/rpi3-bootstrap.sh)


## Install the PyPi Packages
This will install the public Electric code plus some helper commands to make running the services a little easier - when your dev, you'll want to have these PIP packages use your
cloned repo source instead of the source located within the package.  We'll get to that in a moment, first switch to the right python env and get the packages. 

  1. workon electric 
  1. pip install electric 

# To run the server

## Start worker, the webserver and the status commands
1. Use whatever IP address / ssh alias, is right for you
    1. ssh pi3 (pi3 is an ssh alias set in my ~/.ssh/config, not covered here)
    1. sudo electric-server &
    1. sudo electric-worker &
    1. sudo electric-status &

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
  1. Root path is __the full path to the server code__, /home/pi/electric/src/server
  1. Username: pi
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

OK. Now __this is the awesome part__.

Here, we get to run the webserver locally, and the worker remotely, but __all from pycharm on your development machine__.  Woo hoo.

You *must* have successfully setup the previous "deployment" part. This is needed to setup a 'Remote SSH Python'.

### Setup the Remote SSH python interpreter
__This assumes that you have a virtual env setup__

- Add a new Remote
![New Remote](/docs/images/dev/Add_Remote_VM.png)
- Choose 'Deployment'
- Create a Copy
![Settings](/docs/images/dev/Use_Deploy_Config.png)
- Change the python interpreter to _/home/pi/.virtualenvs/electric/bin/python_
- Click OK
- Click Apply to return the interpreter screen
![New VM](/docs/images/dev/New_Remote_VM.png)
- OK again to confirm and choose this as the VM.
- Now go BACK into preferences (now that the remote VM is saved), and reselect the default local virtualenv as the default for the project.

# Pycharm Run Configurations

## Worker
![Worker](/docs/images/dev/Worker.png)

Make sure you also have the env vars set:

   - PYTHONPATH

![Worker Environment Vars](/docs/images/dev/Worker_Env_Vars.png)


## Webserver
![Webserver](/docs/images/dev/Webserver.png)

Make sure you also have the env vars set:

   - ELECTRIC_WORKER (it should be tcp://<some ip>:5001)

![Webserver](/docs/images/dev/Webserver_Env_Vars.png)



