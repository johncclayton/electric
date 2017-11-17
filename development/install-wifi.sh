#!/usr/bin/env bash

set -e

# get the script to setup the wireless
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/wireless/install-wlan.sh

chmod +x install-wlan.sh
install-wlan.sh

