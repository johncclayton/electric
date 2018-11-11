#!/usr/bin/env bash

if [ -z "${BRANCH}" ]; then
    echo "You must set a BRANCH env to something, e.g. master"
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

echo "***************************************"
echo "Part 1 done. Please re login to the pi and run development_part_2.sh"

