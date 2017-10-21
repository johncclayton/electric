#!/usr/bin/env bash

set -e

# lets just say we're gonna install EVERYTHING here
INSTALL_ROOT=/opt

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or sudo me)"
  exit -2
fi

if [ ! -f /proc/device-tree/model ]; then
    echo "You're not running this on a pi3, are you?"
    exit -1
fi

PI_MODEL=$(cat /proc/device-tree/model | awk '{print $1 $2 $3}')
if [ ${PI_MODEL} != 'RaspberryPi3' ]; then
    echo "This computer doesn't appear to be a pi3"
    exit -1
fi

TEMP=${INSTALL_ROOT}/wireless
mkdir -p ${TEMP}
cd ${TEMP}

if [ -f wireless.tar.gz ]; then
    rm -f wireless.tar.gz
fi

apt-get update
apt-get install dnsmasq hostapd gawk

curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/wireless/wireless.tar.gz
tar xzvf wireless.tar.gz

. ${INSTALL_ROOT}/wireless/scripts/functions.sh
. ${INSTALL_ROOT}/wireless/config/wlan.conf

# Allow override
if [ -f "~/.wlan.conf" ]; then
    echo "Using values from ~/.wlan.conf..."
    . "~/.wlan.conf"
end

echo "Ready to configure."
echo "Please modify /opt/wireless/wlan.conf to your liking"

exit 0;

