#!/bin/bash

FROM="$1"
TO="$2"
PIIMG=`which piimg`
MNT="/mnt"
QEMU_ARM="/usr/bin/qemu-arm-static"

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

# copy source -> dest
cp "$FROM" "$TO" 
$PIIMG mount "$TO" "$MNT"

sudo cp "$QEMU_ARM" "$MNT/usr/bin/"
sudo cp run_electric.sh "$MNT/home/pi/" 
sudo cp rc.local "$MNT/etc/rc.local"
sudo cp electric-pi.service "$MNT/etc/systemd/system/" 
sudo cp wpa_supplicant.conf "$MNT/etc/wpa_supplicant/"
sudo cp network_interfaces "$MNT/etc/network/interfaces"
sudo cp hostapdstart "$MNT/usr/local/bin/hostapdstart"
sudo cp hostapd.conf "$MNT/home/pi/hostapd.conf"
sudo cp dnsmasq.conf "$MNT/home/pi/dnsmasq.conf" 

sudo chroot "$MNT" < ./chroot-runtime.sh

$PIIMG umount "$MNT"

exit 0
