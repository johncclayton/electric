#!/bin/bash

set -e
set -x

FROM="$1"
TO="$2"
PIIMG=`which piimg`
MNT="/mnt"
QEMU_ARM="/usr/bin/qemu-arm-static"
DOCKER_IMAGE="scornflake/electric-pi"

if [ -z "$FROM" -o -z "$TO" ]; then
	echo "Use create-image.sh <from> <to>"
	exit 1
fi

if [ ! -f "$FROM" ]; then
	echo "Source img does not exist: $FROM"
	exit 2
fi

if [ -f "$TO" ]; then
	if [ -f "$MNT/bin/dash" ]; then
		echo "UNMOUNTING existing image..."
		$PIIMG umount "$MNT"
	fi

	echo "Removing destination before re-creating it"
	rm "$TO"

	if [ -f "$TO" ]; then
		echo "Destination image STILL exists: $TO"
		exit 3
	fi
fi

if [ ! -d "$MNT" ]; then
	echo "$MNT directory does not exist - we need this to run - go create it please"
	exit 4
fi	

if [ -z "$PIIMG" ]; then
	echo "Cannot find piimg utility, aborting"
	exit 5
fi

if [ ! -f "$QEMU_ARM" ]; then
	echo "Whoa - expected to find $QEMU_ARM binary... didn't, have you done: sudo apt-get install binfmt-support qemu qemu-user-static"
	exit 6
fi

APNAME="ELECTRIC-PI"
APPWD="pa55word"
WIFINAME=""
WIFIPWD=""

while [[ $# -gt 1 ]]
do
key="$1"

case $key in
	-an|--ap-name)
	APNAME="$2"
	shift
	;;
	-ap|--ap-password)
	APPWD="$2"
	shift
	;;
	-wn|--wifi-name)
	WIFINAME="$2"
	shift
	;;
	-wp|--wifi-password)
	WIFIPWD="$2"
	shift
	;;
	*)
	# unknown option
	;;
esac
shift
done

echo "Access Point Name: $APNAME"
echo "Access Point Pass: $APPWD"
echo "WiFi Name        : $WIFINAME"
echo "WiFi Pass        : $WIFIPWD"

if [ -z "$APNAME" -o -z "$APPWD" -o -z "$WIFINAME" -o -z "$WIFIPWD" ]; then
	echo "Fail - APNAME/APPWD/WIFINAME and WIFIPWD all need to be filled in"
	exit 6
fi

# pull docker image and save it as a file...
docker pull "$DOCKER_IMAGE" 

# copy source -> dest
cp "$FROM" "$TO" 
$PIIMG mount "$TO" "$MNT"

sudo cp "$QEMU_ARM" "$MNT/usr/bin/"
sudo cp scripts/* "$MNT/home/pi/"

sudo touch "$MNT/home/pi/docker_image.tar.gz" && sudo chmod 777 "$MNT/home/pi/docker_image.tar.gz"
docker image save "$DOCKER_IMAGE" | gzip > "$MNT/home/pi/docker_image.tar.gz" 

sudo cp scripts/rc.local "$MNT/etc/rc.local"
sudo cp scripts/electric-pi.service "$MNT/etc/systemd/system/"
sudo cp scripts/electric-pi-status.service "$MNT/etc/systemd/system/"
sudo cp scripts/wpa_supplicant.conf "$MNT/etc/wpa_supplicant/"
sudo cp scripts/network_interfaces "$MNT/etc/network/interfaces"
sudo cp scripts/hostapdstart "$MNT/usr/local/bin/hostapdstart"
sudo cp scripts/90-wireless.rules "$MNT/etc/udev/rules.d/"

sudo cp -r ../status "$MNT/home/pi/"

# set up the Access Point name/password defaults.
sudo sed -i "s/APNAME/$APNAME/g" "$MNT/home/pi/hostapd.conf"
sudo sed -i "s/APPWD/$APPWD/g" "$MNT/home/pi/hostapd.conf"
sudo sed -i "s/WIFINAME/$WIFINAME/g" "$MNT/etc/wpa_supplicant/wpa_supplicant.conf"
sudo sed -i "s/WIFIPWD/$WIFIPWD/g" "$MNT/etc/wpa_supplicant/wpa_supplicant.conf"

sudo chroot "$MNT" < ./chroot-runtime.sh
RES=$?

$PIIMG umount "$MNT" 
if [ -d "$HOME/Dropbox/Public" -a "$RES" -eq 0 ]; then
	mv -f "$TO" "$HOME/Dropbox/Public/"
else
	echo "$TO not moved, there was a problem"
fi

exit 0
