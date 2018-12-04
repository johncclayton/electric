#!/usr/bin/env bash

#
# Purpose: to install everything required to run Electric on a Raspberry Pi. 
# Assumptions: this is run on a Raspberry Pi (GPIO packages will be installed).
# 

[ "root" != "$USER" ] && exec sudo -E $0 "$@"

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or sudo me)"
  exit -2
fi

if [ -z "$SUDO_USER" ]; then
    echo "Failed - the script must have SUDO_USER defined so we know which user we're running on behalf of"
    exit 5
fi

if [ ! -d $T ]; then
    mkdir -p "$T"
    chown ${SUDO_USER}:${SUDO_USER} "$T"
fi

T=/tmp/electric-bootstrap

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

apt-get update
apt-get upgrade -y
apt-get install -y gcc python-dev python-pip git g++ avahi-daemon dnsmasq hostapd gawk 
check $? "apt-get for the basics failed"

apt-get install -y linux-headers-rpi libusb-1.0-0-dev libudev-dev cython 
check $? "apt-get failed for the headers & cython"

pip install virtualenv virtualenvwrapper
check $? "pip install for virtualenvwrapper failed"

if [ -f /opt/gpio.sh ]; then
    rm -f /opt/gpio.sh
fi

chmod 777 /opt

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

chmod +x /opt/gpio.sh
chown ${SUDO_USER}:${SUDO_USER} /opt/gpio.sh

# find settings in dhcpcd.conf
grep 'nohook wpa_supplicant' /etc/dhcpcd.conf
if [ $? -ne 0 ]; then
    cat <<-EOF >> /etc/dhcpcd.conf
        nohook wpa_supplicant
        noarp
EOF
fi

# check if the virtualenv wrapper line is already in .bashrc and add if required.
grep 'source /usr/local/bin/virtualenvwrapper.sh' ${HOME}/.bashrc
if [ $? -ne 0 ]; then 
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
    sudo -u $SUDO_USER mkvirtualenv electric
fi

echo
echo "Checking for the GitHub repo in $ELEC_INSTALL ..."

pushd .

cd $HOME

if [ ! -d "$ELEC_INSTALL" ]; then
    sudo -u $SUDO_USER git clone https://github.com/johncclayton/electric.git 
    cd $ELEC_INSTALL && sudo -u $SUDO_USER git checkout -t origin/${BRANCH}
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
sudo -u $SUDO_USER workon electric

echo 
echo "Setting up /opt/prefs directory (stores GPIO state)"
if [ ! -d /opt/prefs ]; then
    mkdir -p /opt/prefs
fi

chown -R pi:users /opt
chmod -R 777 /opt

echo
echo "Installation of hidapi/zeromq - this will take about 30m... patience..."

sudo -u $SUDO_USER pip install -v hidapi
check $? "failed to install hidapi - whoa, that's bad"
sudo -u $SUDO_USER pip install -v pyzmq==17.1.2
check $? "failed to install pyzmq - whoa, that's bad"

echo
echo "Installing the other Python packages..."
sudo -u $SUDO_USER pip install -r "$REQUIREMENTS_FILE"
check $? "failed to install all the requirements - whoa, that's bad"

# and the udev rule so that the charger is automatically available via USB
cp -f $ELEC_INSTALL/src/server/scripts/10-icharger.rules /etc/udev/rules.d/ 
chown root:root /etc/udev/rules.d/10-icharger.rules 

# only really useful when running on a real raspberry Pi (pointless when creating an image)
udevadm control --reload

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

mkdir -p $SYSTEMCTL_FILES
mv $T/electric-status.service $SYSTEMCTL_FILES/ 
mv $T/electric-web.service $SYSTEMCTL_FILES/
mv $T/electric-worker.service $SYSTEMCTL_FILES/

systemctl daemon-reload

systemctl enable electric-status.service
check $? "failed to enable electric-status service"
systemctl enable electric-worker.service
check $? "failed to enable electric-worker service"
systemctl enable electric-web.service
check $? "failed to enable electric-web service"

# lets just say we're gonna install EVERYTHING here
INSTALL_ROOT=/opt

TEMP=${INSTALL_ROOT}/wireless
mkdir -p ${TEMP}
cd ${TEMP}

# the /etc stuff is copied into /opt/wireless as well as into /etc 
cp -avR $ELEC_INSTALL/wireless/scripts .
cp -avR $ELEC_INSTALL/wireless/etc .
cp -avR $ELEC_INSTALL/wireless/etc/* /etc/
cp -avR $ELEC_INSTALL/wireless/config .

# <rant>
# because, it seems hard to have Windows and Linux/Mac users in a Git repo AND to have the damn 
# permissions and LF line endings right, I'm simply going to DO IT MY WAY.  
# It's MY ENVIRONMENT and I'll do what I want ... do what I want ... la la la laaaaa
# </rant>
find ${TEMP}/scripts -type f | xargs chmod +x

# and I *said* LF darn it.
find ${TEMP}/scripts -type f | xargs awk 'BEGIN{RS="^$";ORS="";getline;gsub("\r","");print>ARGV[1]}' 

echo "Please modify the wlan.conf, to specify a WLAN SSID and password. Suitable command follows..."
echo
echo "sudo nano /opt/wireless/config/wlan.conf"
echo

exit 0