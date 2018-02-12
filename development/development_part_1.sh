#!/usr/bin/env bash
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install gcc python-dev g++

wget https://bootstrap.pypa.io/get-pip.py
sudo python get-pip.py
sudo pip install virtualenv virtualenvwrapper

# So that we can access GPIO of the pi3
sudo groupadd gpio
sudo adduser pirate gpio
sudo chown root.gpio /dev/gpiomem
sudo chmod g+rw /dev/gpiomem

echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ~/.bashrc
echo "***************************************"
echo "Part 1 done. Please re login to the pi and run development_part_2.sh"

