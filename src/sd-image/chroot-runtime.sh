#@IgnoreInspection BashAddShebang

set -e
set -u

# DO NOT do apt-get upgrade - this causes the sd-card to NOT BOOT
apt-get -y update
apt-get -y install g++ python-dev python-setuptools python-pip hostapd dnsmasq gawk avahi-daemon 

# Hypriot 1.8 was using this - bye bye, don't want it - we run dnsmasq instead.
apt-get -y remove --purge dhcpcd5
apt-get -y remove python-pip && easy_install pip

/usr/local/bin/pip install -r /opt/status/requirements.txt

# install docker
curl -sSL https://get.docker.com | sh

# install docker-compose
sudo curl -L https://github.com/mjuu/rpi-docker-compose/blob/master/v1.12.0/docker-compose-v1.12.0?raw=true -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# add pirate user - this makes the runtime compatible with Hypriot (and all the scripts we wrote for that)
sudo useradd --shell /bin/bash -G docker -m -s /bin/bash pirate
sudo usermod -a -G users pirate
sudo usermod -a -G docker pi
sudo sh -c 'echo "pirate:hypriot" | chpasswd'

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

# ensure the services start on boot
systemctl enable electric-pi-status.service
systemctl enable electric-pi.service

# Remove /boot/device-init.yaml. It interferes with wpa supplicant
# and prevents wlan1 from coming up properly.
if [ -f "/boot/device-init.yaml" ]; then
    mv "/boot/device-init.yaml" "/boot/device-init.yaml.no-longer-needed"
fi

exit 0
