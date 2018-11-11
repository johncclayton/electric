#!/usr/bin/env bash

if [ -z "${BRANCH}" ]; then
    echo "You must set a BRANCH env to something, e.g. master"
    exit 5
fi

set -e

# get the script to setup the wireless
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/wireless/get-wlan.sh
chmod +x get-wlan.sh
./get-wlan.sh

echo "*************************"
echo "Part 3 done, ready to go!