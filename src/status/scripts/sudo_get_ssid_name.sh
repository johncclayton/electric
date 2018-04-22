#!/usr/bin/env bash

[ "root" != "$USER" ] && exec sudo $0 "$@"
grep -n ssid /etc/wpa_supplicant/wpa_supplicant-wlan0.conf | awk -F \" '{print $2;}'
