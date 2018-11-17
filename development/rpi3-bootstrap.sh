#!/usr/bin/env bash

#
# Purpose: to install everything required to run Electric on a Raspberry Pi. 
# Assumptions: this is run on a Raspberry Pi (GPIO packages will be installed).
# 

# TODO: upgrades - how do these work in dev & production?  presently using /LAST_VERSION 

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

MY_USER=`whoami`
echo <<-EOF > /opt/gpio.sh
    sudo groupadd gpio
    sudo adduser $MY_USER gpio
    sudo chown root.gpio /dev/gpiomem
    sudo chmod g+rw /dev/gpiomem
EOF

sudo chmod +x /opt/gpio.sh

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
    cd electric
    git checkout -t origin/${BRANCH}
    popd
fi

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
if [ ! -d /opt/prefs ]; then
    sudo mkdir -p /opt/prefs
fi

sudo chown root:root /opt/prefs
sudo chmod 777 /opt/prefs

echo
echo "Installation of hidapi/zeromq - this will take about 30m... patience..."
pip install hidapi

echo
echo "Installing the other Python packages..."
pip install -r "$REQUIREMENTS_FILE"

# TODO: ensure that the web runs via gunicorn

sudo mkdir -p /usr/lib/systemd/system

echo
echo "Installing systemd services in /usr/lib/systemd/"
echo <<-EOF > /usr/lib/systemd/system/electric-web.service
    [Unit]
    Description=Electric Web Service
    After=multi-user.target
    Requires=multi-user.target

    [Service]
    Environment=PYTHONPATH=/home/{{user}}/electric/src/server/
    ExecStart=${HOME}/.virtualenvs/electric/bin/python ${HOME}/electric/src/server/electric/main.py

    Type=simple
    User=pi
    Restart=on-failure
    RestartSec=8

    [Install]
    WantedBy=multi-user.target
EOF

echo <<-EOF > /usr/lib/systemd/system/electric-worker.service
    [Unit]
    Description=Electric Worker Service
    After=multi-user.target
    Requires=multi-user.target

    [Service]
    Environment=PYTHONPATH=${HOME}/electric/src/electric/
    ExecStart=${HOME}/.virtualenvs/electric/bin/python ${HOME}/electric/src/server/electric/worker/main.py
    Type=simple
    User=pi
    Restart=on-failure
    RestartSec=8

    [Install]
    WantedBy=multi-user.target
EOF

echo <<-EOF > /usr/lib/systemd/system/electric-status.service
    [Unit]
    Description=Electric Status Service
    After=multi-user.target
    Requires=multi-user.target

    [Service]
    Environment=PYTHONPATH=${HOME}/electric/src/service/
    ExecStart=${HOME}/.virtualenvs/electric/bin/python ${HOME}/electric/src/server/status/main.py
    Type=simple
    User=pi
    Restart=on-failure
    RestartSec=8

    [Install]
    WantedBy=multi-user.target
EOF

# compile the enumeration_interfaces.
pushd . && cd ${HOME}/electric/src/server/status && gcc -o enumerate_interfaces enumerate_interfaces.c && cp enumerate_interfaces /usr/local/bin/ && popd
if [ ! -x /usr/local/bin/enumerate_interfaces ]; then
    echo "Failure to produce enumerate_interfaces in /usr/local/bin - aborting..."
    exit 4
fi

# TODO: check that each of these service files are properly named / in-place.
systemctl enable electric-status.service
systemctl enable electric-worker.service
systemctl enable electric-web.service

echo
echo "Pulling down the network configuration scripts and running them..."
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/wireless/get-wlan.sh
chmod +x get-wlan.sh
./get-wlan.sh