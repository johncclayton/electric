# electric server
Battery charger integration, information and provisioning server.  This is a python application
that exposes your charger information via a RESTful web server.

# how
To use this, you will need the following:
1. iCharger 4010 DUO
1. A mini-USB cable 
1. A Raspberry PI 3 

Install the server from PyPi, e.g.

    $ pip install electric
    
If you have already installed a previous version, use this variant instead

    $ pip install electric --upgrade
    
Then you can run it as a web service using the following command:

    $ electric-server
    
The web service runs on port *5000*.  If you want to change it, you are out of luck
at present until we properly handle configuration params within the deployed configuration file.

# configuration
A configuration file called electric.cfg is deployed to the /etc directory.