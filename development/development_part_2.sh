#!/bin/bash
source /usr/local/bin/virtualenvwrapper.sh
mkvirtualenv electric

echo
echo
echo "Will ask for sudo privs..."
echo 'cd ~/electric/src/server' >> ~/.virtualenvs/electric/bin/postactivate
#git clone https://github.com/johncclayton/electric.git
sudo apt-get install libudev-dev libusb-1.0-0-dev gcc cython cython-dbg
#1. **noobs**: sudo apt-get install libudev-dev libusb-1.0-0.dev gcc cython cython-dev
workon electric

echo
echo
echo "Installation of hidapi will take about 30m..."
pip install hidapi
pip install -r requirements-worker.txt
pip install -r requirements-web.txt

echo "Part 2 done, ready to run!"