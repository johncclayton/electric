Pi Wireless Access Point + Client on a single Wifi interface.
---

The Pi provides a WIFI Access Point called ELECTRIC.  You can connect your phone to the ELECTRIC AP when you're at the field - this allows you to control
the iCharger without having to hook up the Pi to an existing WIFI.

At the same time; the Pi can be configured to connect to your WIFI network at home.  This allows you to leave your phone / computer connected to your home network
and still be able to control the iCharger without having to change networking settings on the Pi. 

Both the ELECTRIC Access Point and the Pi's connection to your home network can happen at the same time - this is not a "this" or "that" situation.

On the ELECTRIC Access Point: 
 - The server is configured to use IP Address 192.168.10.1.
 - The Pi picks up a new IP address when connected to your home WIFI - assuming your home WIFI uses DHCP (almost all do).
 - The app tries *both* IP addresses when connecting, and picks one that works.

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
------------------------------------
- Check /opt/wireless/config/wlan.conf. Are you **sure** **sure** **sure** that the SSID and password are correct? If not, wlan0 won't connect.
- /etc/rc.local **should not call a script**, /opt/wireless/scripts/... (it did in a past version. it should not now)
- Check /etc/network/interfaces.d/wlan0. If should look like this:
    ```
    allow-hotplug wlan0

    auto wlan0
    iface wlan0 inet dhcp
        post-up /opt/wireless/scripts/after-wlan0-up
        post-down /opt/wireless/scripts/after-wlan0-down

    wpa-conf /etc/wpa_supplicant/wpa_supplicant-wlan0.conf
    ```
- Check the 'after wlan0 is up' script: https://github.com/johncclayton/electric/blob/master/wireless/scripts/after-wlan0-up.
    - Check that your local copy in /opt/wireless/scripts is identical.
    - Run electric/wireless/get-wlan.sh again if you are unsure
    - This is important because this script is responsible for bringing up wlan1 (static 192.168.10.1) and also for ensuring the channel number of hostapd is the same as what the wlan0 network is using.
- Linux Wireless (aka: iw)
  - does "iw dev" show wlan0 as being in "managed" mode? if not, you need to change it to "managed". You can't run wlan1 as an "AP" unless wlan0 is in "managed" mode.
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
    - Do a "iwlist channel" from terminal. Here's what mine is like:
     ```
     $ iwlist channel
     vethe2c4787  no frequency information.
     wlan0     11 channels in total; available frequencies :
               Channel 01 : 2.412 GHz
               ...
               Channel 11 : 2.462 GHz
               Current Frequency:2.422 GHz (Channel 3)  <---- THIS BIT IS IMPORTANT
       ```
       Make sure /etc/hostapd/hostapd.conf **channel** is the same (otherwise none of this will work, it'll hang, look like a dns problem, your eth0 will also stop working, dragons will spawn and the sun will explode)
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
  - Does /etc/wpa_supplicant/wpa_supplicant-wlan0.conf have the right details? i.e: an ssid and psk?

    ```
    network={
            ssid="Land of Meat"
            #psk="blah blah blah"
            psk=4510ad5bdbee70922cc907bb9f7c3504d29ffedf31afb2c60d80774925e3215c
    }
    /etc/wpa_supplicant/wpa_supplicant-wlan0.conf (END)
    ```
  - Does wlan1 have an ip? It'd better have! It's static. 192.168.10.1
- NAT / Masquerading
  - "sudo iptables -t nat -S" will show the nat table. You want to see:
    - -A POSTROUTING -o wlan0 -j MASQUERADE
    - (there should be more, but stuffed if I can get iptables to show me something sensible)

