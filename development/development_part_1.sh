#!/usr/bin/env bash
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install gcc python-dev python-pip g++
sudo pip install virtualenv virtualenvwrapper

# get the script to fetch the latest build # from travis
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/development/get-latest-build-number.py

# and the udev rules?
if [ ! -d "/etc/udev/rules.d/10-icharger.rules" ]; then
    curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/src/server/scripts/10-icharger.rules
    mv -f 10-icharger.rules /etc/udev/rules.d/ 
    sudo chown root:root /etc/udev/rules.d/10-icharger.rules 
    sudo udevadm control --reload
fi

# So that we can access GPIO of the pi3 (was already the case on Jessie)
sudo groupadd gpio
sudo adduser `whoami` gpio
sudo chown root.gpio /dev/gpiomem
sudo chmod g+rw /dev/gpiomem

echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ~/.bashrc

echo "***************************************"
echo "Part 1 done. Please re login to the pi and run development_part_2.sh"

