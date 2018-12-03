#!/usr/bin/env bash
# TODO: sudo_get_ssid_name.sh - test on RPI-3B+ and Normal

[ "root" != "$USER" ] && exec sudo $0 "$@"
grep -n ssid /etc/wpa_supplicant/wpa_supplicant-wlan0.conf | awk -F \" '{print $2;}'
