#@IgnoreInspection BashAddShebang

set -e
set -u

# this ensures that udev will recognize the iCharger for non-root users when plugged in.
mv /home/pirate/10-icharger.rules /etc/udev/rules.d/10-icharger.rules

# DO NOT do apt-get upgrade - this causes the sd-card to NOT BOOT
apt-get -y update
apt-get -y install python-dev python-setuptools python-pip hostapd dnsmasq gawk avahi-daemon 
apt-get -y remove python-pip && easy_install pip 
/usr/local/bin/pip install -r /home/pirate/status/requirements.txt

# curl -sSL https://get.docker.com | sh
usermod -aG docker pirate

# compile the enumeration_interfaces.c code for raspberry pi
pushd . && cd /home/pirate/status && gcc -o enumerate_interfaces enumerate_interfaces.c && popd

# owned by the right user
sudo chown -R pirate:users /home/pirate

INSTALL_ROOT=/opt
TEMP=${INSTALL_ROOT}/wireless
cd ${TEMP}

mv /home/pirate/wireless/* .
mv /home/pirate/status /opt/

find ${TEMP}/scripts -type f | xargs chmod +x

. ${INSTALL_ROOT}/wireless/scripts/functions.sh
. ${INSTALL_ROOT}/wireless/config/wlan.conf

# ensure SSH is enabled
touch /boot/ssh

systemctl enable electric-pi-status.service

# Remove /boot/device-init.yaml. It interferes with wpa supplicant
# and prevents wlan1 from coming up properly.
if [ -f "/boot/device-init.yaml" ]; then
    mv "/boot/device-init.yaml" "/boot/device-init.yaml.no-longer-needed"
fi

echo Installing files into /etc...
cp -avR ${TEMP}/etc/* /etc

# make sure we don't have predictable network names enabled - horrible idea.
# echo ' net.ifnames=0 ' >> /boot/cmdline.txt