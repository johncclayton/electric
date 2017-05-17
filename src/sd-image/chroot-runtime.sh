#@IgnoreInspection BashAddShebang

set -e
set -u

cp /etc/ld.so.preload /etc/ld.so.preload-backup
echo "# this stops the runtime from aborting entirely - its undone at the end" > /etc/ld.so.preload

# this ensures that udev will recognize the iCharger for non-root users when plugged in.
echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

# DO NOT do apt-get upgrade - this causes the sd-card to NOT BOOT
apt-get -y update
apt-get -y install python-dev python-setuptools python-pip hostapd dnsmasq

/usr/bin/pip install -r /home/pi/status/requirements.txt

curl -sSL https://get.docker.com | sh

usermod -aG docker pi

# compile the enumeration_interfaces.c code for raspberry pi
pushd . && cd /home/pi/status && gcc -o enumerate_interfaces enumerate_interfaces.c && popd

sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.old
sudo mv /home/pi/dnsmasq.conf /etc/

sudo sed -i "s,DAEMON_CONF=,DAEMON_CONF=/etc/hostapd/hostapd.conf,g" /etc/init.d/hostapd
sudo sed -i "s/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/g" /etc/sysctl.conf

sudo mkdir /etc/systemd/system/dnsmasq.service.d
sudo mv /home/pi/dnsmasq-pre.conf /etc/systemd/system/dnsmasq.service.d/dnsmasq-pre.conf
sudo mv /home/pi/hostapd.conf /etc/hostapd/

systemctl enable dnsmasq.service
systemctl enable electric-pi.service
systemctl enable electric-pi-status.service

# owned by the right user
sudo chown -R pi:users /home/pi

# ensure SSH is enabled
touch /boot/ssh

rm /etc/ld.so.preload
mv /etc/ld.so.preload-backup /etc/ld.so.preload
