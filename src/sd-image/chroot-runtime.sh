#@IgnoreInspection BashAddShebang

set -e
set -u

# DO NOT do apt-get upgrade - this causes the sd-card to NOT BOOT
apt-get -y update
apt-get -y install g++ python-dev python-setuptools python-pip hostapd dnsmasq gawk avahi-daemon 

apt-get -y remove python-pip && easy_install pip 

/usr/local/bin/pip install -r /opt/status/requirements.txt

# compile the enumeration_interfaces.c code for raspberry pi
pushd . && cd /opt/status && gcc -o enumerate_interfaces enumerate_interfaces.c && popd

# install the wireless /etc config to the right directory in the dest image, don't do this BEFORE 
# the call to apt-get above, as otherwise apt-get installation falls over when it encounters duplicates
sudo cp -avR /opt/wireless/etc/* /etc/

# owned by the right user
sudo chown -R root:users /opt

. /opt/wireless/scripts/functions.sh
. /opt/wireless/config/wlan.conf

# ensure scripts are executable
sudo chmod +x /opt/wireless/scripts/*
sudo chmod +x /opt/*.sh

# ensure SSH is enabled (still need this with user-data / cloud-init?)
touch /boot/ssh

# Remove /boot/device-init.yaml. It interferes with wpa supplicant
# and prevents wlan1 from coming up properly.
if [ -f "/boot/device-init.yaml" ]; then
    mv "/boot/device-init.yaml" "/boot/device-init.yaml.no-longer-needed"
fi

exit 0
