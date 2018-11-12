#!/usr/bin/env bash

# temporary, this will be removed later when it all works. 
export BRANCH=unified-server

T=/tmp/electric-bootstrap

if [ ! -d $T ]; then
    mkdir -p "$T"
fi

cd $T

if [ -z "${BRANCH}" ]; then
    echo "You must set a BRANCH env to something, e.g. master or unified-server"
    exit 5
fi

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y gcc python-dev python-pip git g++

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

echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ~/.bashrc
source /usr/local/bin/virtualenvwrapper.sh

ELEC_INSTALL="$HOME/electric"
SRV_CODE="$ELEC_INSTALL/src/server"

echo
echo "electric will be installed to : $ELEC_INSTALL"
echo "The server will reside at     : $SRV_CODE"
echo

cd $HOME
PY=".virtualenvs/electric/bin/python"

if [ ! -e "$PY" ]; then
    echo "$PY does not exist"
    echo "Creating a new virtual env..."
    mkvirtualenv electric
fi

echo
echo "Checking for code ..."

if [ ! -d "$ELEC_INSTALL" ]; then
    echo
    echo "Getting the code... this'll take a bit of time. Go make some tea."
    echo
    pushd .
    cd $HOME
    git clone https://github.com/johncclayton/electric.git 
    git checkout -t origin/${BRANCH}
    popd
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
sudo apt-get install -y linux-headers-rpi libusb-1.0-0-dev libudev-dev cython

echo "Switching to 'electric' virtualenv..."
workon electric

echo 
echo "Setting up /opt/prefs directory"
mkdir -p /opt/prefs
sudo chown `whoami`:`whoami` /opt/prefs

echo
echo "Installation of hidapi will take about 30m..."
pip install hidapi

echo
echo "Installing other required packages..."
pip install -r "$SRV_CODE/requirements-all.txt"

# get the script to setup the wireless
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/wireless/get-wlan.sh
chmod +x get-wlan.sh
./get-wlan.sh

echo "*************************"
echo "Part 3 done, ready to go!"