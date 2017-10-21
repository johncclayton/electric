Setting up a wireless AP + Client on one Wifi interface

Full example files are included (within the /etc/ folder).
These were taken from a working AP+Client install.

To install
---

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
  - Copy start-wlan1.sh to /home/pirate. 
  - chown root.root /home/pirate/start-wlan1.sh
  - chmod +x /home/pirate/start-wlan1.sh
  - rc.local: add /home/pirate/start-wlan1.sh to the file someplace.
  

