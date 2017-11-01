#@IgnoreInspection BashAddShebang

set -e
set -u

# DO NOT do apt-get upgrade - this causes the sd-card to NOT BOOT
apt-get -y update
apt-get -y install g++ python-dev python-setuptools python-pip hostapd dnsmasq gawk avahi-daemon 
apt-get -y remove python-pip && easy_install pip 

/usr/local/bin/pip install -r /opt/status/requirements.txt

# curl -sSL https://get.docker.com | sh
usermod -aG docker pirate

# compile the enumeration_interfaces.c code for raspberry pi
pushd . && cd /opt/status && gcc -o enumerate_interfaces enumerate_interfaces.c && popd

# owned by the right user
sudo chown -R pirate:users /opt

INSTALL_ROOT=/opt

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

# make sure we don't have predictable network names enabled - horrible idea.
# echo ' net.ifnames=0 ' >> /boot/cmdline.txt
