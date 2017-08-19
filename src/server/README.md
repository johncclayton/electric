# Beta Testing

This second is devoted to getting you up & running as a BETA tester.  

You will need a Raspberry Pi 3, some terminal skills, connectivity to Mr Internet and about 45 minutes :-) 

## Prepare the Raspberry Pi 3
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


