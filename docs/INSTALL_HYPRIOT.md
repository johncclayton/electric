Installing Hypriot
==================

You will need:

1. Your brain
1. A connection to Mr Internet
1. Familiarity with shell/terminal, text editing tools

Lets get the stuff
==================

<span style="color:red; font-size: 1.2em; font-weight: 500">DO NOT INSTALL HYPRIOT v1.5</span>

1. Download [Hypriot 1.4.0](https://github.com/hypriot/image-builder-rpi/releases/download/v1.4.0/hypriotos-rpi-v1.4.0.img.zip)
  - Uncompress that file, so that you have a .img file.
  - If you used Safari to download on a Mac, it's probably already uncompressed.
1. Get the [flash tool](https://github.com/hypriot/flash)
1. Get the sample [device init](/docs/config/device-init.yaml) file

Edit and Flash
==============
1. Open device-init.yaml in an editor, and change the SSID and password to something that'll work on your LAN.
1. From terminal:
  - flash -c device-init.yml hypriotos-rpi-v1.4.0.img


<div style="color:red;">*** WARNING: ***</div>
Please CHECK the /dev/disk that *flash* is telling you it's going to blow away.
Get this wrong, and you can hose your entire system. Not my fault!


![Flashing the card](/docs/images/flash-the-card.png)