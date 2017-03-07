#@IgnoreInspection BashAddShebang
cp /etc/ld.so.preload /etc/ld.so.preload-backup

echo "# sometihng amazing" > /etc/ld.so.preload
echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

# DO NOT do apt-get update/upgrade - this causes the sd-card to NOT BOOT
apt-get -y install python-pip python-dev ipython
apt-get -y install bluetooth libbluetooth-dev hostapd dnsmasq
pip install pybluez

curl -sSL https://get.docker.com | sh

usermod -aG docker pi

sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.old

sudo mv /home/pi/dnsmasq.conf /etc/
sudo mv /home/pi/hostapd.conf /etc/hostapd/

systemctl enable dnsmasq.service
systemctl enable electric-pi.service

# ensure SSH is enabled
touch /boot/ssh

rm /etc/ld.so.preload
mv /etc/ld.so.preload-backup /etc/ld.so.preload
