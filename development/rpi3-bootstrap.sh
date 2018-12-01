#!/usr/bin/env bash

#
# Purpose: to install everything required to run Electric on a Raspberry Pi. 
# Assumptions: this is run on a Raspberry Pi (GPIO packages will be installed).
# 

T=/tmp/electric-bootstrap

if [ ! -d $T ]; then
    mkdir -p "$T"
fi

cd $T

if [ -z "${BRANCH}" ]; then
    echo "You must set a BRANCH env to something, e.g. master or unified-server for example"
    exit 5
fi

function check() {
	ERR=$1
	if [ $ERR -ne 0 ]; then
		echo "error result = $ERR: $*"
		exit $ERR
	fi
}

sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y gcc python-dev python-pip git g++ avahi-daemon dnsmasq hostapd gawk 
check $? "apt-get for the basics failed"

sudo apt-get install -y linux-headers-rpi libusb-1.0-0-dev libudev-dev cython 
check $? "apt-get failed for the headers & cython"

sudo pip install virtualenv virtualenvwrapper
check $? "pip install for virtualenvwrapper failed"

if [ -f /opt/gpio.sh ]; then
    sudo rm -f /opt/gpio.sh
fi

sudo chmod 777 /opt

# TODO: test that the gpio.sh fires on each boot of the device BEFORE anything else.  and that this script is sane. 
cat <<EOF > /opt/gpio.sh

if [ ! $(getent group gpio) ]; then
    echo "Creating new gpio group"
    sudo groupadd gpio
fi

GROUP=gpio
if id -nG "$USER" | grep -qw "$GROUP"; then
    echo $USER belongs to $GROUP already
else
    echo $USER does not belong to $GROUP
    sudo adduser $USER gpio
fi

sudo chown root.gpio /dev/gpiomem
sudo chmod g+rw /dev/gpiomem
EOF

sudo chmod +x /opt/gpio.sh
sudo chown ${USER}:${USER} /opt/gpio.sh

# check if the virtualenv wrapper line is already in .bashrc and add if required.
grep 'source /usr/local/bin/virtualenvwrapper.sh' ${HOME}/.bashrc
R=$?
if [ $R -ne 0 ]; then 
    echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ${HOME}/.bashrc
fi

source /usr/local/bin/virtualenvwrapper.sh

ELEC_INSTALL="$HOME/electric"
REQUIREMENTS_DIR="$ELEC_INSTALL/src"
REQUIREMENTS_FILE="$REQUIREMENTS_DIR/requirements-all.txt"

cd $HOME
PY=".virtualenvs/electric/bin/python"
if [ ! -e "$PY" ]; then
    echo "$PY does not exist"
    echo "Creating a new virtual env..."
    mkvirtualenv electric
fi

echo
echo "Checking for the GitHub repo in $ELEC_INSTALL ..."

pushd .

cd $HOME

if [ ! -d "$ELEC_INSTALL" ]; then
    git clone https://github.com/johncclayton/electric.git 
    cd $ELEC_INSTALL && git checkout -t origin/${BRANCH}
fi

cd $HOME

echo
echo "Checking for requirements files are present..."

if [ ! -f "$REQUIREMENTS_FILE" ]; then
    echo "Something is wrong. There's no requirements file. This should exist at $REQUIREMENTS_FILE"
    echo "- Did something break with the git checkout?"
    echo "- Are you on the right branch?"
    echo "- Is the earth still round?"

    echo "Current working directory:" `pwd`
    echo "Listing of $ELEC_INSTALL"
    ls -l $ELEC_INSTALL

    exit 6
fi

echo "Switching to 'electric' virtualenv..."
workon electric

echo 
echo "Setting up /opt/prefs directory (stores GPIO state)"
if [ ! -d /opt/prefs ]; then
    sudo mkdir -p /opt/prefs
fi

sudo chown -R pi:users /opt
sudo chmod -R 777 /opt

echo
echo "Installation of hidapi/zeromq - this will take about 30m... patience..."

pip install -v hidapi
check $? "failed to install hidapi - whoa, that's bad"
pip install -v pyzmq==17.1.2
check $? "failed to install pyzmq - whoa, that's bad"

echo
echo "Installing the other Python packages..."
pip install -r "$REQUIREMENTS_FILE"
check $? "failed to install all the requirements - whoa, that's bad"

# and the udev rule so that the charger is automatically available via USB
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/src/server/scripts/10-icharger.rules
sudo cp -f 10-icharger.rules /etc/udev/rules.d/ 
sudo chown root:root /etc/udev/rules.d/10-icharger.rules 

# only really useful when running on a real raspberry Pi (pointless when creating an image)
sudo udevadm control --reload

# TODO: ensure that the web runs via gunicorn and not the default flask
# TODO: watchmedo - reload code when it is touched

echo
echo "Installing systemd services in /usr/lib/systemd/"
cat <<EOF > $T/electric-web.service
[Unit]
Description=Electric Web Service
After=multi-user.target
Requires=multi-user.target

[Service]
Environment=PYTHONPATH=${HOME}/electric/src/server/
ExecStart=${HOME}/.virtualenvs/electric/bin/python ${HOME}/electric/src/server/electric/main.py

Type=simple
User=pi
Restart=on-failure
RestartSec=8

[Install]
WantedBy=multi-user.target
EOF

cat <<EOF > $T/electric-worker.service
[Unit]
Description=Electric Worker Service
After=multi-user.target
Requires=multi-user.target

[Service]
Environment=PYTHONPATH=${HOME}/electric/src/server/
ExecStart=${HOME}/.virtualenvs/electric/bin/python ${HOME}/electric/src/server/electric/worker/worker.py
Type=simple
User=pi
Restart=on-failure
RestartSec=8

[Install]
WantedBy=multi-user.target
EOF

cat <<EOF > $T/electric-status.service
[Unit]
Description=Electric Status Service
After=multi-user.target
Requires=multi-user.target

[Service]
Environment=PYTHONPATH=${HOME}/electric/src/server/
ExecStart=${HOME}/.virtualenvs/electric/bin/python ${HOME}/electric/src/server/status/main.py
Type=simple
User=pi
Restart=on-failure
RestartSec=8

[Install]
WantedBy=multi-user.target
EOF

# compile the enumeration_interfaces code (used by status service)
pushd . && cd ${HOME}/electric/src/server/status && gcc -o enumerate_interfaces enumerate_interfaces.c && sudo cp enumerate_interfaces /usr/local/bin/ && popd
if [ ! -x /usr/local/bin/enumerate_interfaces ]; then
    echo "Failure to produce enumerate_interfaces in /usr/local/bin - aborting..."
    exit 4
fi

SYSTEMCTL_FILES=/usr/lib/systemd/system

sudo mkdir -p $SYSTEMCTL_FILES
sudo mv $T/electric-status.service $SYSTEMCTL_FILES/ 
sudo mv $T/electric-web.service $SYSTEMCTL_FILES/
sudo mv $T/electric-worker.service $SYSTEMCTL_FILES/

sudo systemctl daemon-reload

sudo systemctl enable electric-status.service
check $? "failed to enable electric-status service"
sudo systemctl enable electric-worker.service
check $? "failed to enable electric-worker service"
sudo systemctl enable electric-web.service
check $? "failed to enable electric-web service"

echo
echo "Pulling down the network configuration scripts and running them..."
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/wireless/get-wlan.sh
chmod +x get-wlan.sh
./get-wlan.sh
RES=$?

if [ $RES -ne 0 ]; then
    echo "Error installing WiFi configuration via get-wlan.sh"
    exit $RES
fi

if [ ! -d "/opt/wireless" ]; then
    echo "Error - couldnt find the /opt/wireless directory - get-wlan.sh appears to have failed"
    exit 6
else
    echo "*** SUCCESS ***"
fi

exit 0