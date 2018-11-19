#!/usr/bin/env bash
# TODO: sudo_get_ap_channel - test on RPI-3B+ and Normal

[ "root" != "$USER" ] && exec sudo $0 "$@"
grep channel /etc/hostapd/hostapd.conf | awk -F= '{print $2;}'