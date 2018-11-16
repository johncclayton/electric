#!/usr/bin/env bash

#
# Purpose: to install everything required to run Electric on a Raspberry Pi. 
# Assumptions: this is run on a Raspberry Pi (GPIO packages will be installed).
# 

# TODO: upgrades - how do these work in dev? 
# TODO: upgrades - how do these work in production?  presently using /LAST_VERSION 


T=/tmp/electric-bootstrap

if [ ! -d $T ]; then
    mkdir -p "$T"
fi

cd $T

if [ -z "${BRANCH}" ]; then
    echo "You must set a BRANCH env to something, e.g. master or unified-server for example"
    exit 5
fi

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y gcc python-dev python-pip git g++ avahi-daemon dnsmasq hostapd gawk

sudo pip install virtualenv virtualenvwrapper

# and the udev rules?
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/src/server/scripts/10-icharger.rules
sudo cp -f 10-icharger.rules /etc/udev/rules.d/ 
sudo chown root:root /etc/udev/rules.d/10-icharger.rules 
sudo udevadm control --reload

# So that we can access GPIO of the pi3 (was already the case on Jessie)
sudo groupadd gpio
sudo adduser `whoami` gpio
sudo chown root.gpio /dev/gpiomem
sudo chmod g+rw /dev/gpiomem

# check if the virtualenv wrapper line is already in .bashrc and add if required.
grep 'source /usr/local/bin/virtualenvwrapper.sh' ~/.bashrc
R=$?
if [ $R -ne 0 ]; then 
    echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ~/.bashrc
fi

source /usr/local/bin/virtualenvwrapper.sh

ELEC_INSTALL="$HOME/electric"
REQUIREMENTS_DIR="$ELEC_INSTALL/src"
REQUIREMENTS_FILE="$REQUIREMENTS_DIR/requirements-all.txt"

echo
echo "electric will be installed to : $ELEC_INSTALL"
echo

# setup / check the virtualenv wrapper environment in the users home directory

cd $HOME

PY=".virtualenvs/electric/bin/python"

if [ ! -e "$PY" ]; then
    echo "$PY does not exist"
    echo "Creating a new virtual env..."
    mkvirtualenv electric
fi

echo
echo "Checking for the GitHub repo in ${HOME}/electric ..."

if [ ! -d "$ELEC_INSTALL" ]; then
    pushd .
    cd $HOME
    git clone https://github.com/johncclayton/electric.git 
    git checkout -t origin/${BRANCH}
    popd
fi

#
# decided to take this out as I'd rather run the remote sync/debugging from a desktop
#echo 'cd ~/electric/src/server' >> ~/.virtualenvs/electric/bin/postactivate
#

echo
echo "Checking for requirements files are present..."

if [ ! -f "$REQUIREMENTS_FILE" ]; then
    echo "Something is wrong. There's no requirements file. This should exist at $REQUIREMENTS_FILE"
    echo "- Did something break with the git checkout?"
    echo "- Are you on the right branch?"
    echo "- Is the earth still round?"
    exit
fi

echo
echo "Installing required packages (might ask for sudo privs)..."
sudo apt-get install -y linux-headers-rpi libusb-1.0-0-dev libudev-dev cython 

echo "Switching to 'electric' virtualenv..."
workon electric

echo 
echo "Setting up /opt/prefs directory (stores GPIO state)"
sudo mkdir -p /opt/prefs
sudo chown root:root /opt/prefs
sudo chmod 777 /opt/prefs

echo
echo "Installation of hidapi/zeromq - this will take about 30m... patience..."
pip install hidapi

echo
echo "Installing the other Python packages..."
pip install -r "$REQUIREMENTS_FILE"

echo
echo "Pulling down the network configuration scripts and running them..."
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/wireless/get-wlan.sh
chmod +x get-wlan.sh
./get-wlan.sh

echo "******************************************************************************************"
echo "DONE!  The Pi has now been configured as an Access Point - look for a WiFi called Electric"
echo "******************************************************************************************"

