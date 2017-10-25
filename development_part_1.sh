#!/usr/bin/env bash
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install gcc python-dev g++

wget https://bootstrap.pypa.io/get-pip.py
sudo python get-pip.py
sudo pip install virtualenv virtualenvwrapper

echo 'source /usr/local/bin/virtualenvwrapper.sh' >> ~/.bashrc
echo "***************************************"
echo "Part 1 done. Please re login to the pi and run development_part_2.sh"

