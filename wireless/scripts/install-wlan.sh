#!/usr/bin/env bash

set -x

# lets just say we're gonna install EVERYTHING here
INSTALL_ROOT=/opt

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or sudo me)"
  exit -2
fi

# if [ ! -z ${+x} ]; then
#     if [ ! -f /proc/device-tree/model ]; then
#         echo "You're not running this on a pi3, are you?"
#         exit -1
#     fi

#     PI_MODEL=$(cat /proc/device-tree/model | awk '{print $1 $2 $3}')
#     if [ ${PI_MODEL} != 'RaspberryPi3' ]; then
#         echo "This computer doesn't appear to be a pi3"
#         exit -1
#     fi
# fi

TEMP=${INSTALL_ROOT}/wireless

. ${INSTALL_ROOT}/wireless/scripts/functions.sh
. ${INSTALL_ROOT}/wireless/config/wlan.conf

# Allow override
if [ -f "${HOME}/.wlan.conf" ]; then
    echo "Using values from ${HOME}/.wlan.conf..."
    source "${HOME}/.wlan.conf"
    echo "WLAN1 name is ${WLAN1_NAME}"
fi

echo Installing files into /etc...
cp -avR ${TEMP}/etc/* /etc
