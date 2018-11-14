#!/usr/bin/env bash

[ "root" != "$USER" ] && exec sudo $0 "$@"
# gets the current configured SSID value from wpa_supplicant.conf file
grep -n ssid /etc/wpa_supplicant/wpa_supplicant.conf | awk -F \" '{print $2;}'
