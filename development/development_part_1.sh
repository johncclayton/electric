#!/usr/bin/env bash

[ "root" != "$USER" ] && exec sudo $0 "$@"

BRANCH=master

apt-get update
apt-get upgrade
apt-get install -y gcc python-dev python-pip git g++
pip install virtualenv virtualenvwrapper

# and the udev rules?
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/src/server/scripts/10-icharger.rules
cp -f 10-icharger.rules /etc/udev/rules.d/ 
chown root:root /etc/udev/rules.d/10-icharger.rules 
udevadm control --reload

# So that we can access GPIO of the pi3 (was already the case on Jessie)
groupadd gpio
adduser `whoami` gpio
chown root.gpio /dev/gpiomem
chmod g+rw /dev/gpiomem

echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ~/.bashrc

echo "***************************************"
echo "Part 1 done. Please re login to the pi and run development_part_2.sh"

