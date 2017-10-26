pi3 wireless AP + Client on one Wifi interface.
---

A phone can connect directly to either the "Electric" network (say, when you're at the field) and also have an IP address on your own internal network (when you're at home). This means you dont have to change anything in the app once it's configured the first time. Ta daa!
 - The server is hard configured to be at 192.168.10.1.
 - The pi3 picks up a new IP address when connected to your Wifi.
 - **TODO**: The app tries *both* IP addresses when connecting, and picks one that works.

Semi Automated Install
--
 - sudo apt-get update
 - sudo apt-get install dnsmasq hostapd gawk avahi-daemon
 - curl --location https://raw.githubusercontent.com/johncclayton/electric/master/wireless/get-wlan.sh | sudo bash -s
 - Configure as needed, i.e: edit the wlan.conf file in /opt/wireless/conf
 - cd /opt/wireless/scripts
 - sudo ./install-wlan.sh
 - If it fails with:

      ```
      wpa_supplicant: /sbin/wpa_supplicant daemon failed to start
      run-parts: /etc/network/if-pre-up.d/wpasupplicant exited with return code 1
      Failed to bring up wlan0.
      ```

   Just run the installer again.

So what's happening here?
--
- wlan0 is configured to be auto, dhcp.
- wpa_supplicant is used to auto join wlan0 to a home wifi network.
- hostapd advertises wlan1 (static, 192.168.10.1) to clients
- dnsmasq is configured to handout DHCP answers on wlan1 only
- wlan0 is configured as a managed interface (iw dev)
- rc.local runs a script that brings up wlan1 (as an AP) on boot
- rc.local restarts both hostapd and dnsmasq, because at boot time wlan1 doesn't exist and so the services don't start.

Troubleshooting (hopefully in order)
--
- You did remove /boot/device-init.yaml right? Check it's not there.
- Check /etc/network/interfaces.d/wlan0. If should look like this:

    ```
    allow-hotplug wlan0

    auto wlan0
    iface wlan0 inet dhcp
        post-up /opt/wireless/scripts/after-wlan0-up
        post-down /opt/wireless/scripts/after-wlan0-down

    wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf
    ```

- Linux Wirelss (aka: iw)
  - does "iw dev" show wlan0 as being in "managed" mode?
    - if not, you need to change it to managed. You can't run wlan1 as an "AP" unless wlan0 is in "managed" mode.
  - does "iw dev" show both wlan0 and wlan1?

    ```
    phy#0
    	Interface wlan1
    		ifindex 4
    		wdev 0x2
    		addr b8:27:eb:dd:d1:77
    		ssid Electric Clear
    		type AP
    	Interface wlan0
    		ifindex 3
    		wdev 0x1
    		addr b8:27:eb:dd:d1:77
    		ssid Land of Meat
    		type managed
    ```
    - If no wlan1:
        - Do a **iw dev wlan0 interface add wlan1 type __ap**, does an "iw dev" now show wlan1?
        - If not, erm. damn. "Good luck with that".
        - You are using a pi3, right?
- ifconfig
  - Do wlan0 and wlan1 show up?
    ```
    wlan0     Link encap:Ethernet  HWaddr b8:27:eb:dd:d1:77
              inet addr:192.168.1.30  Bcast:192.168.1.255  Mask:255.255.255.0
              inet6 addr: 2002:cb56:cef0:0:ba27:ebff:fedd:d177/64 Scope:Global
              inet6 addr: fe80::ba27:ebff:fedd:d177/64 Scope:Link
              UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
              RX packets:553 errors:0 dropped:12 overruns:0 frame:0
              TX packets:157 errors:0 dropped:0 overruns:0 carrier:0
              collisions:0 txqueuelen:1000
              RX bytes:97540 (95.2 KiB)  TX bytes:24817 (24.2 KiB)

    wlan1     Link encap:Ethernet  HWaddr b8:27:eb:dd:d1:77
              inet addr:192.168.10.1  Bcast:192.168.10.255  Mask:255.255.255.0
              inet6 addr: fe80::ba27:ebff:fedd:d177/64 Scope:Link
              UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
              RX packets:2 errors:0 dropped:2 overruns:0 frame:0
              TX packets:32 errors:0 dropped:0 overruns:0 carrier:0
              collisions:0 txqueuelen:1000
              RX bytes:120 (120.0 B)  TX bytes:5578 (5.4 KiB)

    ```
  - If not wlan1, then there's a problem with the 'iw dev wlan0 interface add __ap' part of the script (see /opt/wireless/scripts/after-wlan0-up). It might be that wlan0 isn't configured in 'managed' mode (it might be in AP mode)
  - Does wlan0 have an ip?
  - Does /etc/wpa_supplicant/wpa_supplicant.conf have the right details? i.e: an ssid and psk?

    ```
    network={
            ssid="Land of Meat"
            #psk="blah blah blah"
            psk=4510ad5bdbee70922cc907bb9f7c3504d29ffedf31afb2c60d80774925e3215c
    }
    /etc/wpa_supplicant/wpa_supplicant.conf (END)
    ```
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
