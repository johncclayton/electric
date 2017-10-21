#!/bin/bash

# Add the wlan1 interface
iw dev wlan0 interface add wlan1 type __ap

# Enable IP forwarding and masq.
echo 1 >/proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE
iptables -A FORWARD -i wlan0 -o wlan1 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i wlan1 -o wlan0 -j ACCEPT

#iptables -t nat -A POSTROUTING -s 192.168.10.0/24 ! -d 192.168.10.0/24 -j MASQUERADE

# Make sure that the channel being used by hostapd is the same as that on eth0

# Ensure dnsmaqq running
/etc/init.d/dnsmasq restart

# Make sure hostapd is running
/etc/init.d/hostapd restart
