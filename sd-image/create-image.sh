#!/bin/bash

set -e
set -x

PIIMG=`which piimg`
QEMU_ARM="/usr/bin/qemu-arm-static"
ROOT="/buildkit"
SOURCE_IMG=$ROOT/template-image.img
MNT="$ROOT/mnt"
OPT="$MNT/opt"

mkdir -p "$MNT"

# TRAVIS_BRANCH actually overrides the BRANCH setting.
if [ ! -z ${TRAVIS_BRANCH} ]; then
	BRANCH=`echo $TRAVIS_BRANCH | sed 's/\//_/g' | sed 's/[-+*$%^!]/x/g'`
fi

if [ ! -d "$MNT" ]; then
	echo "$MNT directory does not exist - we need this to run - go create it please"
	exit 15
fi	

if [ ! -f "$QEMU_ARM" ]; then
	echo "Whoa - expected to find $QEMU_ARM binary... and didn't"
	exit 10
fi

if [ -z "$PIIMG" ]; then
	echo "Cannot find piimg utility, aborting"
	exit 11
fi

if [ ! -f "$SOURCE_IMG" ]; then
	echo "Source img does not exist - was looking for: $SOURCE_IMG"
	exit 12
fi

if [ -z "$BRANCH" ]; then
	echo "I can't detect the name of the branch - aborting..."
	exit 13
fi

if [ -z "$TRAVIS_BUILD_NUMBER" ]; then
	echo "I can't detect the TRAVIS_BUILD_NUMBER - aborting..."
	exit 13
fi

VERSION_NUM="$TRAVIS_BUILD_NUMBER"
DEST_IMAGE="/tmp/electric-${BRANCH}-${VERSION_NUM}.img"

echo "Branch is: $BRANCH"
echo "Latest version is: $VERSION_NUM"
echo "Destination image: $DEST_IMAGE"

if [ -f "$DEST_IMAGE" ]; then
	if [ -f "$MNT/bin/dash" ]; then
		echo "UNMOUNTING existing image..."
		$PIIMG umount "$MNT"
	fi

	echo "Removing destination before re-creating it"
	rm "$DEST_IMAGE"

	if [ -f "$DEST_IMAGE" ]; then
		echo "Destination image STILL exists - even though I just tried hard to delete it: $DEST_IMAGE"
		exit 14
	fi
fi

#############################
## THE PROCESS STARTS HERE ##
#############################

# copy source -> dest so we don't change the original image
cp "$SOURCE_IMG" "$DEST_IMAGE"

# store the output from PIIMG, because we can use it to scan for the loopback devices
# that we're allocated - and thus we can free them up too (piimg doesnt do this properly?)
sudo $PIIMG mount "$TO" "$MNT" > $ROOT/piimg-mount.txt
sudo cp "$QEMU_ARM" "$MNT/usr/bin/"

# TODO: and where this comes from for both production and dev builds.
# you would think you can echo this directly into the $OPT area - you can't, perm. denied
# so I create the file here and move it across - worth a groan or two.
echo "$VERSION_NUM" > ./LAST_DEPLOY
sudo mv ./LAST_DEPLOY "$OPT"

# TODO: publish the build to Google Drive or somewhere.
# TODO: make sure this goes into the development area, and that the GPIO user/group is correctly done
#       on startup as well.
# sudo cp scripts/gpiomem.service "$MNT/etc/systemd/system/"
sudo ../../development/rpi3-bootstrap.sh "$MNT/opt/rpi3-bootstrap.sh"
sudo chroot "$MNT" < ./chroot-runtime.sh
RES=$?

sudo find "$OPT" -name "*.sh" -type f | sudo xargs chmod +x

sudo $PIIMG umount "$MNT"

# TODO: clean up the /dev/loop devices - there are two of them, stored in $ROOT/piimg-mount.txt

echo "Your SD Image build was a complete success, huzzzah!"
echo "Burn this image to an SD card: $DEST_IMAGE"

exit 0
