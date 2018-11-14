#@IgnoreInspection BashAddShebang

set -e
set -u

# this runs the entire dev bootstrapping experience from within
# the chroot jail.  All the same benefits, all the same style.
/opt/rpi3-bootstrap.sh

# compile the enumeration_interfaces.c code for raspberry pi
pushd . && cd /home/pi/electric/src/server/status && gcc -o enumerate_interfaces enumerate_interfaces.c && cp enumerate_interfaces /usr/local/bin/ && popd

# ensure SSH is enabled
touch /boot/ssh

systemctl enable electric-pi-status.service
systemctl enable electric-pi.service

# Remove /boot/device-init.yaml. It interferes with wpa supplicant
# and prevents wlan1 from coming up properly.
if [ -f "/boot/device-init.yaml" ]; then
    mv "/boot/device-init.yaml" "/boot/device-init.yaml.no-longer-needed"
fi

exit 0
