#!/bin/bash

set -e
set -x

TO="/tmp/electric-sd-card.img"
PIIMG=`which piimg`
QEMU_ARM="/usr/bin/qemu-arm-static"

MNT="/mnt"
OPT="$MNT/opt"

DESTINATION_NAME="electric-sd-card"
DESTINATION_AFTER_BUILD="$HOME/Dropbox/Electric Storage"

DOCKER_IMAGE_WEB="johncclayton/electric-pi-web"
DOCKER_IMAGE_WORKER="johncclayton/electric-pi-worker"
DOCKER_IMAGE_UI="hypriot/rpi-dockerui"

# Let the user specify defaults in a .config if they are brave
FROM="hypriotos-rpi-v1.8.0-resized.img"
BRANCH=`echo $TRAVIS_BRANCH | sed 's/\//_/g' | sed 's/[-+*$%^!]/x/g'`

if [ ! -f "$QEMU_ARM" ]; then
	echo "Whoa - expected to find $QEMU_ARM binary... didn't, have you done: sudo apt-get install binfmt-support qemu qemu-user-static"
	exit 6
fi

if [ -z "$PIIMG" ]; then
	echo "Cannot find piimg utility, aborting"
	exit 5
fi

if [ ! -f "$FROM" ]; then
	echo "Source img does not exist: $FROM"
	exit 2
fi

if [ -z "$BRANCH" ]; then
	echo "I can't detect the name of the branch - aborting..."
	exit 7
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

# We're building. Now. We DONT want to use the 'latest build from travis', we want to use the one we just pushed!
VERSION_NUM="$TRAVIS_BUILD_NUMBER"

#curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/master/development/get-latest-build-number.py
#VERSION_NUM=`python get-latest-build-number.py`
echo "Branch is: $BRANCH"
echo "Latest version is: $VERSION_NUM"

copy_to_external()
{
        N="${DESTINATION_NAME}_${BRANCH}"
        cp "$TO" "$DESTINATION_AFTER_BUILD/${N}_${VERSION_NUM}.img"
        cd "$DESTINATION_AFTER_BUILD" && ls -1 -tp ${N}* | grep -v '/$' | tail -n +2 | xargs -I {} rm {}
}

# pull docker image and save it as a file...
docker pull "$DOCKER_IMAGE_WEB:$VERSION_NUM"
docker pull "$DOCKER_IMAGE_WORKER:$VERSION_NUM"
docker pull "$DOCKER_IMAGE_UI"

# copy source -> dest so we don't change the original image
cp "$FROM" "$TO" 
sudo $PIIMG mount "$TO" "$MNT"
sudo cp "$QEMU_ARM" "$MNT/usr/bin/"

# this ensures that udev will recognize the iCharger for non-root users when plugged in.
sudo cp ../server/scripts/10-icharger.rules "$MNT/etc/udev/rules.d/"

sudo mkdir -p "$OPT"
sudo mkdir -p "$OPT/wireless"
sudo chmod 777 "$OPT"
sudo chmod 777 "$OPT/wireless"

# you would think you can echo this directly into the $OPT area - you can't, perm. denied
# so I create the file here and move it across - worth a groan or two.
echo "$VERSION_NUM" > ./LAST_DEPLOY
echo "$TRAVIS_BRANCH" > ./LAST_BRANCH
sudo mv ./LAST_DEPLOY "$OPT"

sudo cp -r ../../wireless/etc "$OPT/wireless/"
sudo cp -r ../../wireless/config "$OPT/wireless/"
sudo cp -r ../../wireless/scripts "$OPT/wireless/"

sudo touch "$OPT/docker_image_web.tar.gz" && sudo chmod 777 "$OPT/docker_image_web.tar.gz"
sudo touch "$OPT/docker_image_worker.tar.gz" && sudo chmod 777 "$OPT/docker_image_worker.tar.gz"
sudo touch "$OPT/docker_image_ui.tar.gz" && sudo chmod 777 "$OPT/docker_image_ui.tar.gz"

docker image save "$DOCKER_IMAGE_WEB:$VERSION_NUM" | gzip > "$OPT/docker_image_web.tar.gz"
docker image save "$DOCKER_IMAGE_WORKER:$VERSION_NUM" | gzip > "$OPT/docker_image_worker.tar.gz"
docker image save "$DOCKER_IMAGE_UI" | gzip > "$OPT/docker_image_ui.tar.gz"

sudo cp scripts/electric-pi-status.service "$MNT/etc/systemd/system/"
sudo cp scripts/electric-pi.service "$MNT/etc/systemd/system/"
sudo cp scripts/gpiomem.service "$MNT/etc/systemd/system/"

sudo cp -r ../status "$OPT"
sudo cp ../../docker-compose.yml "$OPT"

sudo cp scripts/user-data "$MNT/boot/user-data"
sudo chmod 755 "$MNT/boot/user-data"

# lets try to disable network config for cloud-init
#sudo mkdir -p "$MNT/etc/cloud/cloud.cfg.d"
#sudo cp scripts/disable-network-config.cfg "$MNT/etc/cloud/cloud.cfg.d/01-disable-network-config.cfg"
#sudo chmod 644 "$MNT/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg"

sudo cp scripts/bootstrap_docker_images.sh "$OPT"
sudo cp scripts/ensure_gpio_writable.sh "$OPT"
sudo cp scripts/upgrade.sh "$OPT"
sudo cp compose-command.sh "$OPT"

sudo find "$OPT" -name "*.sh" -type f | sudo xargs chmod +x

sudo chroot "$MNT" < ./chroot-runtime.sh
RES=$?

sudo $PIIMG umount "$MNT"

if [ -d "$DESTINATION_AFTER_BUILD" -a "$RES" -eq 0 ]; then
	copy_to_external
else
	echo "$TO not moved, there was a problem"
fi

exit 0
