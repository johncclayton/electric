#!/usr/bin/env bash

[ "root" != "$USER" ] && exec sudo -E $0 "$@"

if [ -z "${BRANCH}" ]; then
    echo "You must set a TRAVIS_BRANCH env to something, e.g. master"
    exit 5
fi

set -e

# lets just say we're gonna install EVERYTHING here
INSTALL_ROOT=/opt

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or sudo me)"
  exit -2
fi

TEMP=${INSTALL_ROOT}/wireless
mkdir -p ${TEMP}
cd ${TEMP}

curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/wireless/wireless.tar.gz
tar xzf wireless.tar.gz

# <rant>
# because, it seems hard to have Windows and Linux/Mac users in a Git repo AND to have the damn 
# permissions and LF line endings right, I'm simply going to DO IT MY WAY.  
# It's MY ENVIRONMENT and I'll do what I want ... do what I want ... la la la laaaaa
# </rant>
find ${TEMP}/scripts -type f | xargs chmod +x

# and I *said* LF darn it.
find ${TEMP}/scripts -type f | xargs awk 'BEGIN{RS="^$";ORS="";getline;gsub("\r","");print>ARGV[1]}' 

. ${INSTALL_ROOT}/wireless/scripts/functions.sh
. ${INSTALL_ROOT}/wireless/config/wlan.conf

echo "Ready to configure."
echo "Please modify the wlan.conf, to specify a WLAN SSID and password. Suitable command follows..."
echo
echo "sudo nano /opt/wireless/config/wlan.conf"
echo

echo Installing files into /etc...
cp -avR ${TEMP}/etc/* /etc

exit 0;
