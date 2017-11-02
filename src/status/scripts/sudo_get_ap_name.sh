#!/usr/bin/env bash

[ "root" != "$USER" ] && exec sudo $0 "$@"
grep ssid /etc/hostapd/hostapd.conf | head -1 | awk -F= '{print $2;}'