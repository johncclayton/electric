#!/usr/bin/env bash

# TODO: sudo_set_sid.sh - test on RPI-3B+ and Normal

# relaunch using sudo as required
[ "root" != "$USER" ] && exec sudo $0 "$@"

WIFINAME="$1"
WIFIPWD="$2"

if [ -z "$WIFINAME" -o -z "$WIFIPWD" ]; then
    echo "Parameters are zero or otherwise incorrect, specify wifi name then password"
    exit 1
fi

/etc/init.d/hostapd stop

/sbin/ifdown wlan0

# sets the current configured SSID/PSK value in the wpa_supplicant.conf file
cp /opt/wireless/scripts/wpa_supplicant_head.tpl /etc/wpa_supplicant/wpa_supplicant-wlan0.conf
/usr/bin/wpa_passphrase "$WIFINAME" "$WIFIPWD" >> /etc/wpa_supplicant/wpa_supplicant-wlan0.conf

/sbin/ifup wlan0

# Bring up hostapd again, even if bringing up wlan0 failed
/etc/init.d/hostapd start
