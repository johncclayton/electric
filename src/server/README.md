# electric server
Battery charger integration, information and provisioning server.  This is a python application
that exposes your charger information via a RESTful web server.

# how
To use this, you will need the following:
1. iCharger 4010 DUO
1. A mini-USB cable 
1. A Raspberry PI 2 -or- 3 

Install the server from PyPi, e.g.

    $ pip install electric
    
Then you can run it as a web service using the following command:

    $ electric-server
    
    