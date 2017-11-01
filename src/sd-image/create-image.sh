#!/bin/bash

set -e
set -x

FROM="$1"
TO="$2"

PIIMG=`which piimg`
QEMU_ARM="/usr/bin/qemu-arm-static"

MNT="/mnt"
OPT="$MNT/opt"

DOCKER_IMAGE_WEB="johncclayton/electric-pi-web"
DOCKER_IMAGE_WORKER="johncclayton/electric-pi-worker"

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

if [ -f ./.config ]; then
	. ./.config
fi

# get the script to fetch the latest build # from travis
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/get-latest-build-number.py
VERSION_NUM=`python get-latest-build-number.py`
echo "Latest version is: $VERSION_NUM"

# pull docker image and save it as a file...
docker pull "$DOCKER_IMAGE_WEB:$VERSION_NUM"
docker pull "$DOCKER_IMAGE_WORKER:$VERSION_NUM"

# copy source -> dest so we don't change the original image
cp "$FROM" "$TO" 
sudo $PIIMG mount "$TO" "$MNT"
sudo cp "$QEMU_ARM" "$MNT/usr/bin/"

# this ensures that udev will recognize the iCharger for non-root users when plugged in.
sudo cp ../server/scripts/10-icharger.rules "$MNT/etc/udev/rules.d/"

sudo mkdir -p "$OPT"
sudo mkdir -p "$OPT/wireless"
echo > "$OPT/LAST_DEPLOY" $VERSION_NUM

sudo cp -r ../../wireless/etc "$OPT/wireless/"
sudo cp -r ../../wireless/config "$OPT/wireless/"
sudo cp -r ../../wireless/scripts "$OPT/wireless/"

# install the wireless /etc config to the right directory in the dest image
sudo cp -avR ../../wireless/etc/* "$MNT/etc/"

sudo touch "$OPT/docker_image_web.tar.gz" && sudo chmod 777 "$OPT/docker_image_web.tar.gz"
sudo touch "$OPT/docker_image_worker.tar.gz" && sudo chmod 777 "$OPT/docker_image_worker.tar.gz"

docker image save "$DOCKER_IMAGE_WEB:$VERSION_NUM" | gzip > "$OPT/docker_image_web.tar.gz"
docker image save "$DOCKER_IMAGE_WORKER:$VERSION_NUM" | gzip > "$OPT/docker_image_worker.tar.gz"

sudo cp scripts/electric-pi-status.service "$MNT/etc/systemd/system/"

sudo cp -r ../status "$OPT"
sudo cp ../../docker-compose.yml "$OPT"
sudo cp compose-command.sh "$OPT"

sudo find "$OPT" -name "*.sh" -type f | sudo xargs chmod +x

sudo chroot "$MNT" < ./chroot-runtime.sh
RES=$?

sudo $PIIMG umount "$MNT" 
if [ -d "$HOME/Dropbox/Public" -a "$RES" -eq 0 ]; then
	cp "$TO" "$HOME/Dropbox/Public/"
else
	echo "$TO not moved, there was a problem"
fi

exit 0
