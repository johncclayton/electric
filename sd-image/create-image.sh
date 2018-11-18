#!/bin/bash

set -e
set -x

PIIMG=`which piimg`
QEMU_ARM="/usr/bin/qemu-arm-static"
VERSION_NUM="$TRAVIS_BUILD_NUMBER"

# TRAVIS_BRANCH actually overrides the BRANCH setting.
if [ ! -z ${TRAVIS_BRANCH} ]; then
	BRANCH=`echo $TRAVIS_BRANCH | sed 's/\//_/g' | sed 's/[-+*$%^!]/x/g'`
fi

if [ -z "$TRAVIS_BUILD_NUMBER" ]; then
	echo "I can't detect the TRAVIS_BUILD_NUMBER - aborting..."
	exit 13
fi

if [ ! -f "$QEMU_ARM" ]; then
	echo "Whoa - expected to find $QEMU_ARM binary... and didn't"
	exit 10
fi

if [ -z "$PIIMG" ]; then
	echo "Cannot find piimg utility, aborting"
	exit 11
fi

if [ -z "$BRANCH" ]; then
	echo "I can't detect the name of the branch - aborting..."
	exit 13
fi

ROOT="/buildkit/${BRANCH}/${VERSION_NUM}"
MNT="$ROOT/mnt"
OPT="$MNT/opt"
PIIMG_STATE="$ROOT/piimg.state"

mkdir -p "$MNT"

if [ ! -d "$MNT" ]; then
	echo "$MNT directory does not exist - we need this to run - go create it please"
	exit 15
fi	

SOURCE_IMG=/buildkit/template-image.img

if [ ! -f "$SOURCE_IMG" ]; then
	echo "Source img does not exist - was looking for: $SOURCE_IMG"
	exit 12
fi

DEST_IMAGE="$ROOT/electric-${BRANCH}-${VERSION_NUM}.img"

echo "Branch is: $BRANCH"
echo "Latest version is: $VERSION_NUM"
echo "Destination image: $DEST_IMAGE"

if [ -f "$DEST_IMAGE" ]; then
	if [ -f "$MNT/bin/dash" ]; then
		echo "UNMOUNTING existing image..."
		sudo $PIIMG umount "$MNT"
	fi

	echo "Removing destination before re-creating it"
	rm "$DEST_IMAGE"

	if [ -f "$DEST_IMAGE" ]; then
		echo "Destination image STILL exists - even though I just tried hard to delete it: $DEST_IMAGE"
		exit 14
	fi
fi

function cleanup_piimg() {
	if [ -f "$PIIMG_STATE" ]; then
		DEV=`sed s,/dev/loop,, $PIIMG_STATE`
		echo "Attempting cleanup on /dev/loop${DEV}"
		sudo losetup -d /dev/loop${DEV}
		NEXT_DEV=$((DEV + 1))
		echo "Attempting cleanup on /dev/loop${NEXT_DEV}"
		sudo losetup -d /dev/loop${NEXT_DEV}
	fi
}

#############################
## THE PROCESS STARTS HERE ##
#############################
cleanup_piimg

# copy source -> dest so we don't change the original image
cp "$SOURCE_IMG" "$DEST_IMAGE"

# store the output from PIIMG, because we can use it to scan for the loopback devices
# that we're allocated - and thus we can free them up too (piimg doesnt do this properly?)
sudo losetup -f > $PIIMG_STATE
sudo $PIIMG mount "$DEST_IMAGE" "$MNT"
sudo cp "$QEMU_ARM" "$MNT/usr/bin/"

# you would think you can echo this directly into the $OPT area - you can't, perm. denied
# so I create the file here and move it across - worth a groan or two.
echo "$VERSION_NUM" > ./LAST_DEPLOY
sudo mv ./LAST_DEPLOY "$OPT"

sudo cp ../development/rpi3-bootstrap.sh "$MNT/opt/rpi3-bootstrap.sh"

sudo HOME=/home/pi USER=pi BRANCH=${BRANCH} TRAVIS_BUILD_NUMBER=${VERSION_NUM} chroot --userspec=pi:users "$MNT" < ./chroot-runtime.sh
RES=$?

sudo $PIIMG umount "$MNT"

cleanup_piimg

sudo rm -rf "$MNT"

echo "Your SD Image build was a complete success, huzzzah!"
echo "Burn this image to an SD card: $DEST_IMAGE"

# publish the build by copying it with scp using the given identity / path
SETUP_ROOT=/buildkit
PUBLISH_SH=${SETUP_ROOT}/publish.sh

if [ -x ${PUBLISH_SH} ]; then
	echo "Publishing ${DEST_IMAGE} using ${PUBLISH_SH}..."
	${PUBLISH_SH} ${DEST_IMAGE}
fi

exit 0
