#!/bin/bash

source /usr/local/bin/virtualenvwrapper.sh

if [ ! -f "~/.virtualenvs/electric/bin/python" ]; then
    mkvirtualenv electric
fi

echo
echo "Checking for code ..."

if [ ! -d '~/electric' ]; then
    echo
    echo "Getting the code... this'll take a bit of time. Go make some tea."
    echo
    cd ~/
    git clone https://github.com/johncclayton/electric.git
fi

echo
echo "Checking for server folder ..."

if [ ! -d "~/electric/server" ]; then
    echo "Something is wrong. There's no '~/electric/server folder. "
    echo "- Did something break with the git checkout?"
    echo "- Do you have an '~/electric' folder at all?"
    exit
fi

echo 'cd ~/electric/src/server' >> ~/.virtualenvs/electric/bin/postactivate

echo
echo "Checking for requirements files ..."

if [ ! -f "requirements-worker.txt" ]; then
    echo "Something is wrong. There's no requirements-worker.txt. This should exist at ~/electric/src/server"
    echo "You need to run this from the server folder. e.g: cd ~/electric/src/server"
    echo "Try: cd ~/electric/src/server, and then sh ~/electric/development/development_part_2.sh"
    exit
fi

echo
echo "Installing required packages"
echo "Will ask for sudo privs..."
sudo apt-get install libudev-dev libusb-1.0-0-dev gcc cython cython-dbg
#1. **noobs**: sudo apt-get install libudev-dev libusb-1.0-0.dev gcc cython cython-dev

echo "Switching to 'electric' virtualenv..."
workon electric

echo
echo "Installation of hidapi will take about 30m..."
pip install hidapi

echo
echo "Installing worker and web packages..."
pip install -r requirements-worker.txt
pip install -r requirements-web.txt

echo "***************************************************************"
echo "Part 2 done, ready to run!"