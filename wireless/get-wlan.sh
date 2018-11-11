#!/usr/bin/env bash
[ "root" != "$USER" ] && exec sudo $0 "$@"

if [ -z "${BRANCH}" ]; then
    echo "You must set a BRANCH env to something, e.g. master"
    exit 5
fi

set -e

# lets just say we're gonna install EVERYTHING here
INSTALL_ROOT=/opt

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (or sudo me)"
  exit -2
fi

# the image builder scripts don't need this so it sets SKIP_PI3_CHECK
if [ ! -z ${SKIP_PI3_CHECK+x} ]; then
    if [ ! -f /proc/device-tree/model ]; then
        echo "You're not running this on a pi3, are you?"
        exit -1
    fi

    PI_MODEL=$(cat /proc/device-tree/model | awk '{print $1 $2 $3}')
    if [ ${PI_MODEL} != 'RaspberryPi3' ]; then
        echo "This computer doesn't appear to be a pi3"
        exit -1
    fi
fi

TEMP=${INSTALL_ROOT}/wireless
mkdir -p ${TEMP}
cd ${TEMP}

if [ -f wireless.tar.gz ]; then
    rm -f wireless.tar.gz
fi

curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/wireless/wireless.tar.gz
tar xzf wireless.tar.gz

find ${TEMP}/scripts -type f | xargs chmod +x

. ${INSTALL_ROOT}/wireless/scripts/functions.sh
. ${INSTALL_ROOT}/wireless/config/wlan.conf

echo "Ready to configure."
echo "Please modify the wlan.conf, to specify a WLAN SSID and password. Suitable command follows..."
echo "sudo nano /opt/wireless/config/wlan.conf"
echo "Then run sudo /opt/wireless/scripts/install-wlan.sh"

if [ -f wireless.tar.gz ]; then
    rm -f wireless.tar.gz
fi

exit 0;
