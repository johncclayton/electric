pi3 wireless AP + Client on one Wifi interface.
---

A phone can connect directly to either the "Electric" network (say, when you're at the field) and also have an IP address on your own internal network (when you're at home). This means you dont have to change anything in the app once it's configured the first time. Ta daa!
 - The server is hard configured to be at 192.168.10.1.
 - The pi3 picks up a new IP address when connected to your Wifi.
 - The app (TODO btw) tries *both* IP addresses when connecting, and picks one that works.

Semi Automated Install
--
 - $ curl --location https://raw.githubusercontent.com/johncclayton/electric/master/wireless/get-wlan.sh | sudo bash -s
 - Configure as needed
 - cd /opt/wireless
 - sudo ./install-wlan.sh

So what's happening here?
--
- wlan0 is configured to be auto, dhcp.
- wpa_supplicant is used to auto join wlan0 to a home wifi network.
- hostapd advertises wlan1 (static, 192.168.1.10) to clients
- dnsmasq is configured to only handout DHCP answers on wlan1
- wlan0 is configured as a managed interface (iw dev)
- rc.local runs a script that brings up wlan1 (iw dev add, adds an AP) on boot
- rc.local restarts both hostapd and dnsmasq, because at boot time wlan1 doesn't exist and so the services don't start.

Troubleshooting (hopefully in order)
--
- iw
  - does "iw dev" show both wlan0 and wlan1? If not the later, "good luck with that"
- ifconfig
  - Do wlan0 and wlan1 show up?  If not wlan1, then there's a problem with the 'iw dev wlan0 interface add __ap' part of the script (start-wlan1.sh). It might be that wlan0 isn't configured in 'managed' mode (it might be in AP mode)
  - Does wlan0 have an ip? wpa_supplicant.conf have the right details?
  - Does wlan1 have an ip? It'd better have! It's static. 192.168.10.1
- NAT / Masquerading
  - "sudo iptables -t nat -S" will show the nat table. You want to see:
    - -A POSTROUTING -o wlan0 -j MASQUERADE
    - (there should be more, but stuffed if I can get iptables to show me something sensible)



Manual Install (don't do this, it's painful)
---
Full configuration files are included (within the /etc/ folder).  They are what is used by the automated install, and were lovingly hand crafted from a working AP+Client install.

- sudo apt-get update
- sudo apt-get install dnsmasq hostapd
- [this may not matter any more?  wlan0 can be connected to a local Wifi, with DHCP] ... Remove the /boot/device-init.yaml. That’ll kill our wlan0 on startup if it’s there.
- Setup config
  - Copy wlan0 and wlan1 to /etc/network/interfaces.d/
  - Copy hostapd.conf to /etc/hostapd/
  - Copy dnsmasq.d/wlan1 to /etc/dnsmasq.d/
  - Copy wpa_supplicant.conf to /etc/wpa_supplicant/
- Configure hostapd
  - IMPORTANT: Setup the channel to match wlan0. Do a "iwlist channel" from terminal, and make sure /etc/hostapd/hostapd.conf channel is the same (otherwise none of this will work, it'll hang, and look like a dns problem, your eth0 will also stop working, dragons will spawn and the sun will explode)
  - Change your password from 'electric' if you want.
- Setup default
  - /etc/default/hostapd: DAEMON_CONF="/etc/hostapd/hostapd.conf"
- Make it run on start
  - Copy start-wlan1.sh to /opt/wireless/scripts.
  - chown root.root /opt/wireless/scripts/start-wlan1.sh
  - chmod +x /opt/wireless/scripts/start-wlan1.sh
  - rc.local: add /opt/wireless/scripts/start-wlan1.sh to the file someplace.
