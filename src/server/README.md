# electric server
Battery charger integration, information and provisioning server.  This is a python application
that exposes your charger information via a RESTful web server.

# how
To use this, you will need the following:
1. iCharger 4010 DUO
1. A mini-USB cable
1. A Raspberry PI 2 -or- 3

There are two ways to run the server - either from a module installed via PyPi, or via a
copy of the GitHub repo.

# running from PyPi installed server
Install the server from PyPi, e.g.

    $ pip install electric

If you have already installed a previous version, use this variant instead

    $ pip install electric --upgrade

Then you can run it as a web service using the following command:

    $ electric-server

The web service runs on port *5000*.  If you want to change it, you are out of luck
at present until we properly handle configuration params within the deployed configuration file.

# running from the github repo
Use the run_server.sh script within this directory to start the server.  This assumes your current python
environment has all the required modules installed into it.

# configuration
A configuration file called electric.cfg is deployed to the /etc directory.