export LC_ALL="en_US.UTF-8"

cp /etc/ld.so.preload /etc/ld.so.preload-backup

echo "# sometihng amazing" > /etc/ld.so.preload
echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

# DO NOT do apt-get update/upgrade - this causes the sd-card to NOT BOOT

curl -sSL https://get.docker.com | sh
usermod -aG docker pi
systemctl enable electric-pi.service

rm /etc/ld.so.preload
mv /etc/ld.so.preload-backup /etc/ld.so.preload
