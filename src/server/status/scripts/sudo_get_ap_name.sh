#!/usr/bin/env bash
# TODO: sudo_get_ap_name - test on RPI-3B+ and Normal

[ "root" != "$USER" ] && exec sudo $0 "$@"
grep ssid /etc/hostapd/hostapd.conf | head -1 | awk -F= '{print $2;}'