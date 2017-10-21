#!/usr/bin/env bash

set -e

. wlan.conf
. scripts/functions.sh

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

curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/wireless/wireless.tar.gz
tar xzf wireless.tar.gz

if [ "$INSTALL_TO_ETCx" != "x" ]; then
    REPLY= ask_question "This will overwrite files in /etc. Sure? "
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted"
        exit -1
    fi

    echo Installing files into /etc...
    cp -av ${TEMP}/etc /etc
else
    REPLY=y
fi

# Copy the scripts we need
mkdir -p ${INSTALL_ROOT}/scripts
cp -av ${TEMP}/scripts ${INSTALL_ROOT}/scripts

# Fix the WLAN0 ssid/password
wpa_passphrase "$WLAN0_SSID" "$WLAN0_PASSWORD" >/etc/wpa_supplicant/wpa_supplicant.conf

# Bounce the interface to get wpa_supplicant to do its thing
ifdown wlan0
ifup wlan0

# Cannot check for the actual channel until its connected.
# This is done in a post-up script of wlan0 (see after-wlan0-up)

