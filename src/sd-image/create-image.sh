#!/bin/bash

set -e
set -x

PIIMG=`which piimg`
QEMU_ARM="/usr/bin/qemu-arm-static"
ROOT="/buildkit"
SOURCE_IMG=/buildkit/template-image.img
MNT="/$ROOT/mnt"
OPT="$MNT/opt"

BRANCH=`echo $TRAVIS_BRANCH | sed 's/\//_/g' | sed 's/[-+*$%^!]/x/g'`

# TEMPORARY - overrides while I test this on a machine.
BRANCH=unified-server
TRAVIS_BUILD_NUMBER=11
# END OF TEMPORARY

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

copy_to_external()
{
        N="${DESTINATION_NAME}_${BRANCH}"
        cp "$TO" "$DESTINATION_AFTER_BUILD/${N}_${VERSION_NUM}.img"
        cd "$DESTINATION_AFTER_BUILD" && ls -1 -tp ${N}* | grep -v '/$' | tail -n +2 | xargs -I {} rm {}
}

#############################
## THE PROCESS STARTS HERE ##
#############################

# copy source -> dest so we don't change the original image
cp "$SOURCE_IMG" "$DEST_IMAGE"

# store the output from PIIMG, because we can use it to scan for the loopback devices
# that we're allocated - and thus we can free them up too (piimg doesnt do this properly?)
sudo $PIIMG mount "$TO" "$MNT" > $ROOT/piimg-mount.txt
sudo cp "$QEMU_ARM" "$MNT/usr/bin/"

# you would think you can echo this directly into the $OPT area - you can't, perm. denied
# so I create the file here and move it across - worth a groan or two.
echo "$VERSION_NUM" > ./LAST_DEPLOY
sudo mv ./LAST_DEPLOY "$OPT"

# TODO: make sure this goes into the development area.
# sudo cp scripts/gpiomem.service "$MNT/etc/systemd/system/"
sudo ../../development/rpi3-bootstrap.sh "$MNT/opt/rpi3-bootstrap.sh"
sudo chroot "$MNT" < ./chroot-runtime.sh
RES=$?

sudo find "$OPT" -name "*.sh" -type f | sudo xargs chmod +x

sudo $PIIMG umount "$MNT"

if [ -d "$DESTINATION_AFTER_BUILD" -a "$RES" -eq 0 ]; then
	copy_to_external
else
	echo "$TO not moved, there was a problem"
fi

exit 0
