#@IgnoreInspection BashAddShebang
set -e
set -u

cp /etc/ld.so.preload /etc/ld.so.preload-backup
echo "# this stops the runtime from aborting entirely - its undone at the end" > /etc/ld.so.preload

cd $HOME
# this ensures that udev will recognize the iCharger for non-root users when plugged in.
mv 10-icharger.rules /etc/udev/rules.d/10-icharger.rules

# DO NOT do apt-get upgrade - this causes the sd-card to NOT BOOT
apt-get -y update
apt-get -y install python-dev python-setuptools python-pip hostapd dnsmasq gawk avahi-daemon libbluetooth-dev bluez

/usr/bin/pip install -r $HOME/status/requirements.txt

# curl -sSL https://get.docker.com | sh

usermod -aG docker pi

# compile the enumeration_interfaces.c code for raspberry pi
pushd . && cd $HOME/status && gcc -o enumerate_interfaces enumerate_interfaces.c && popd

# systemctl enable electric-pi-status.service

# owned by the right user
sudo chown -R pi:users $HOME/

# ensure SSH is enabled
touch /boot/ssh

# make sure we don't have predictable network names enabled - horrible idea.
# echo ' net.ifnames=0 ' >> /boot/cmdline.txt

rm /etc/ld.so.preload
mv /etc/ld.so.preload-backup /etc/ld.so.preload
