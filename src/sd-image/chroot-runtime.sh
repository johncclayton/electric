#@IgnoreInspection BashAddShebang
set -e
set -u

# this ensures that udev will recognize the iCharger for non-root users when plugged in.
mv /home/pirate/10-icharger.rules /etc/udev/rules.d/10-icharger.rules

# DO NOT do apt-get upgrade - this causes the sd-card to NOT BOOT
apt-get -y update
apt-get -y install python-dev python-setuptools python-pip hostapd dnsmasq gawk avahi-daemon libbluetooth-dev bluez

/usr/bin/pip install -r /home/pirate/status/requirements.txt

# curl -sSL https://get.docker.com | sh

usermod -aG docker pi

# compile the enumeration_interfaces.c code for raspberry pi
pushd . && cd /home/pirate/status && gcc -o enumerate_interfaces enumerate_interfaces.c && popd

# systemctl enable electric-pi-status.service

# owned by the right user
sudo chown -R pi:users /home/pirate

# ensure SSH is enabled
touch /boot/ssh

# make sure we don't have predictable network names enabled - horrible idea.
# echo ' net.ifnames=0 ' >> /boot/cmdline.txt

#rm /etc/ld.so.preload
#mv /etc/ld.so.preload-backup /etc/ld.so.preload
