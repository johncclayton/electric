#!/usr/bin/env bash
# TODO: sudo_get_ssid_name.sh - test on RPI-3B+ and Normal

[ "root" != "$USER" ] && exec sudo $0 "$@"
# gets the current configured SSID value from wpa_supplicant.conf file
grep -n ssid /etc/wpa_supplicant/wpa_supplicant.conf | awk -F \" '{print $2;}'
