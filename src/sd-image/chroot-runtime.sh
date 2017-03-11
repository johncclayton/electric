#@IgnoreInspection BashAddShebang

set -e
set -u

cp /etc/ld.so.preload /etc/ld.so.preload-backup

echo "# sometihng amazing" > /etc/ld.so.preload
echo 'SUBSYSTEMS=="usb", ATTRS{idVendor}=="0483", ATTRS{idProduct}=="5751", MODE:="0666"' > /etc/udev/rules.d/10-icharger.rules

# DO NOT do apt-get update/upgrade - this causes the sd-card to NOT BOOT
apt-get -y install python-dev ipython python-setuptools python-pip
apt-get -y install bluetooth libbluetooth-dev hostapd dnsmasq

pip install pybluez
pip install -r /home/pi/requirements.txt

curl -sSL https://get.docker.com | sh
usermod -aG docker pi

mv /etc/dnsmasq.conf /etc/dnsmasq.conf.old
mv /home/pi/dnsmasq.conf /etc/

sed -i "s,DAEMON_CONF=,DAEMON_CONFIG=/etc/hostapd/hostapd.conf,g" /etc/init.d/hostapd
sed -i "s/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/g" /etc/sysctl.conf

mkdir /etc/systemd/system/dnsmasq.service.d
mv /home/pi/dnsmasq-pre.conf /etc/systemd/system/dnsmasq.service.d/dnsmasq-pre.conf
mv /home/pi/hostapd.conf /etc/hostapd/

systemctl enable dnsmasq.service
systemctl enable electric-pi.service

# ensure SSH is enabled
touch /boot/ssh

rm /etc/ld.so.preload
mv /etc/ld.so.preload-backup /etc/ld.so.preload
