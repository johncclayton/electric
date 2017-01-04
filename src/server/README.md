# electric server
Battery charger integration, information and provisioning server.  This is a python application
that exposes your charger information via a RESTful web server.

# what you'll need
To use this, you will need the following:
1. iCharger 408 or 4010 DUO
1. A mini-USB cable to connect the Raspberry PI3 to your iCharger 
1. A Raspberry PI 3 

Please note: a Raspberry PI 2 WILL NOT suffice as this project uses Bluetooth BLE and WIFI, both
of which are present on the v3 PI and NOT on the v2 PI.

# running from the PyPi distribution
There are two ways to run the server - either from a module installed via PyPi, or via a
copy of the GitHub repo.

Install the server from PyPi, e.g.

    $ pip install electric

If you have already installed a previous version, use this variant instead

    $ pip install electric --upgrade

Then you can run it as a web service using the following command:

    $ electric-server

The web service runs on port 5000 - you have no choice.  Thank you for your co-operation.

# running from the github repo
Setup a virtualenv for the project, and load the required modules using the requirements.txt file

    $  pip install -r requirements.txt

Use the run_server.sh script within this directory to start the server.  This assumes your current python
environment has all the required modules installed of course.

# publish to pypi or pypitest repository
The server code can be published to the pypi repo as long as you have account credentials for the pypi
repository set up in your ~/.pypirc file.  See the pypirc_template for an example of this file. 

The setup.py is generated from a template so that we can easily inject requirements and version information
into the file on any platform without having to duplicate information in two places. 

## example publishing to pypitest (the test environment)

    $ python scripts/distribute.py -v "0.6.8" -p -t
    
