#!/bin/bash

source /usr/local/bin/virtualenvwrapper.sh
cd ~/

ELEC_INSTALL="$HOME/electric"
SRV_CODE="$ELEC_INSTALL/src/server"

echo
echo "electric will be installed to : $ELEC_INSTALL"
echo "The server will reside at     : $SRV_CODE"
echo

PY=".virtualenvs/electric/bin/python"
if [ ! -e "$PY" ]; then
    echo "$PY does not exist"
    echo "Creating a new virtual env..."
    mkvirtualenv electric
fi

echo
echo "Checking for code ..."

if [ ! -d 'electric' ]; then
    echo
    echo "Getting the code... this'll take a bit of time. Go make some tea."
    echo
    git clone https://github.com/johncclayton/electric.git
fi

echo
echo "Checking for server folder ..."

if [ ! -d "$SRV_CODE" ]; then
    echo "Something is wrong. There's no '$SRV_CODE' folder. "
    echo "- Did something break with the git checkout?"
    echo "- Do you have an '~/electric' folder at all?"
    exit
fi

echo 'cd ~/electric/src/server' >> ~/.virtualenvs/electric/bin/postactivate

echo
echo "Checking for requirements files ..."

if [ ! -f "$SRV_CODE/requirements-all.txt" ]; then
    echo "Something is wrong. There's no requirements-all.txt. This should exist at $SRV_CODE"
    echo "- Did something break with the git checkout?"
    echo "- Are you on the right branch?"
    echo "- Is the earth still round?"
    exit
fi

echo
echo "Installing required packages"
echo "Will ask for sudo privs..."
sudo apt-get install linux-headers-rpi libusb-1.0-0-dev libudev-dev python-pip gcc cython

echo "Switching to 'electric' virtualenv..."
workon electric

echo
echo "Installation of hidapi will take about 30m..."
pip install hidapi

echo
echo "Installing other required packages..."
pip install -r "$SRV_CODE/requirements-all.txt"

echo "***************************************************************"
echo "Part 2 done, ready to run!"