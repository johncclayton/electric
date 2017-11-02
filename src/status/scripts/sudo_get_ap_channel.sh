#!/usr/bin/env bash
[ "root" != "$USER" ] && exec sudo $0 "$@"
grep channel /etc/hostapd/hostapd.conf | awk -F= '{print $2;}'