#!/usr/bin/env bash
# relaunch using sudo as required
[ "root" != "$USER" ] && exec sudo $0 "$@"

WIFINAME="$1"
WIFIPWD="$2"
if [ -z "$WIFINAME" -o -z "$WIFIPWD" ]; then
    echo "Params not right, specify wifi name then password"
    exit 1
fi

# sets the current configured SSID/PSK value in the wpa_supplicant.conf file
cp /home/pi/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf
sed -i "s/WIFINAME/$WIFINAME/g" /etc/wpa_supplicant/wpa_supplicant.conf
sed -i "s/WIFIPWD/$WIFIPWD/g" /etc/wpa_supplicant/wpa_supplicant.conf

ifdown wlan0 && ifup wlan0
