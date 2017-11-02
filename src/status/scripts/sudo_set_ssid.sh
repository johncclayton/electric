#!/usr/bin/env bash

# relaunch using sudo as required
[ "root" != "$USER" ] && exec sudo $0 "$@"

WIFINAME="$1"
WIFIPWD="$2"

if [ -z "$WIFINAME" -o -z "$WIFIPWD" ]; then
    echo "Parameters are zero or otherwise incorrect, specify wifi name then password"
    exit 1
fi

# sets the current configured SSID/PSK value in the wpa_supplicant.conf file
/usr/bin/wpa_passphrase "$WIFINAME" "$WIFIPWD" > /etc/wpa_supplicant/wpa_supplicant.conf
/sbin/ifdown wlan0 
/sbin/ifup wlan0
