#!/usr/bin/env bash
# relaunch using sudo as required
[ "root" != "$USER" ] && exec sudo $0 "$@"
# gets the current configured SSID PSK from wpa_supplicant.conf file
grep -n psk /etc/wpa_supplicant/wpa_supplicant.conf | awk -F \" '{print $2;}'
