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

. ${INSTALL_ROOT}/wireless/scripts/functions.sh
. ${INSTALL_ROOT}/wireless/config/wlan.conf

# Allow override
if [ -f "~/.wlan.conf" ]; then
    echo "Using values from ~/.wlan.conf..."
    . "~/.wlan.conf"
end

echo Installing files into /etc...
cp -avR ${TEMP}/etc/* /etc

# TODO: do the iw dev wlan0 add... etc, if the interface wlan1 doesn't already exist.

# Fix the WLAN0 ssid/password
wpa_passphrase "$WLAN0_SSID" "$WLAN0_PASSWORD" >/etc/wpa_supplicant/wpa_supplicant.conf

# Bounce the interface to get wpa_supplicant to do its thing
ifdown wlan0
ifup wlan0

# Cannot check for the actual channel until its connected.
# This is done in a post-up script of wlan0 (see after-wlan0-up)
