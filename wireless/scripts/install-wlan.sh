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
if [ -f "${HOME}/.wlan.conf" ]; then
    echo "Using values from ${HOME}/.wlan.conf..."
    . "${HOME}/.wlan.conf"
fi

echo Installing files into /etc...
cp -avR ${TEMP}/etc/* /etc

# do the iw dev wlan0 add... etc, if the interface wlan1 doesn't already exist.
# TODO: I don't think this condition fires. needs more work.
# TODO: idea is that if wlan1 isn't present, we add it. Seems to get skipped?
HAVE_WLAN1=$(iw dev | grep 'wlan1')
echo "Check value: ${HAVE_WLAN1}x"
if [ "${HAVE_WLAN1}x" == "x" ]; then
    echo "Adding wlan1 AP interface..."
        /opt/wireless/scripts/start-wlan1.sh
fi

# Fix the WLAN0 ssid/password
echo "Configuring wlan0 to use $WLAN0_SSID"
wpa_passphrase "$WLAN0_SSID" "$WLAN0_PASSWORD" >/etc/wpa_supplicant/wpa_supplicant.conf

# Bounce the interface to get wpa_supplicant to do its thing
ifdown wlan0
ifup wlan0

# Cannot check for the actual channel until its connected.
# This is done in a post-up script of wlan0 (see after-wlan0-up)
