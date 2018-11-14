#!/bin/bash
sudo apt-get -y update
sudo apt-get install -y unzip binfmt-support qemu qemu-user-static make g++ curl git libparted0-dev

SETUP_ROOT=/buildkit
sudo mkdir -p ${SETUP_ROOT} && sudo chmod 777 ${SETUP_ROOT} 
cd ${SETUP_ROOT}

if [ ! -d "piimg" ]; then
    git clone https://github.com/alexchamberlain/piimg

    pushd .
    cd piimg && make && sudo cp src/piimg /usr/local/bin/
    popd 
fi

if [ ! -x /usr/local/bin/piimg ]; then
    echo "Failed to find the piimg binary in the /usr/local/bin directory"
    exit 4
fi

# just in case you run this again, clean out the old stuff, retaining the
# ZIP file as this is unlikely to change all that often.  
rm *.img

# find any existing file - potentially nothing of course.
ZIP_FILENAME=`ls -1 *.zip`

# only download if the ZIP file isn't there.
if [ -z "$ZIP_FILENAME" ]; then
    # download from here, following redirects.  
    curl -O -J -L "https://downloads.raspberrypi.org/raspbian_lite_latest" 
    ZIP_FILENAME=`ls -1 *.zip`
fi

if [ ! -f "$ZIP_FILENAME" ]; then
    echo "Failure to detect the ZIP file from Raspbian - was looking for $ZIP_FILENAME"
    exit 5
fi

unzip -o $ZIP_FILENAME 
IMG_FILENAME=`ls -1 *raspbian*.img`

WORKING_IMAGE=image.img
cp $IMG_FILENAME $WORKING_IMAGE
truncate -s +1G $WORKING_IMAGE

if [ ! -d electric ]; then
    git clone https://github.com/johncclayton/electric.git
else
    pushd .
    cd electric && git pull
    popd
fi

export SECTOR_SIZE=`fdisk -l $WORKING_IMAGE | grep 'Sector size' | awk '{print $7;}'`
export LOOPBACK=-1

function find_loopback() {
    N=-1
    FOUND=0
    while [ $FOUND -eq 0 ]; do
        N=$((N + 1))
        sudo losetup /dev/loop${N}
        FOUND=$?
    done

    if [ $FOUND -eq 1 ]; then
        LOOPBACK=$N
    else
        LOOPBACK=-1
    fi
}

find_loopback

# simple validation; if this isn't true then parsing is likely wrong
if [ 512 -ne $SECTOR_SIZE ]; then
    echo "Parsing the sector size didn't seem to work - aborting through abject fear"
    exit 4
fi

if [ $LOOPBACK -eq -1 ]; then
    echo "Unable to find a suitable/available loopback device - which is needed to manipulate the partition table of the raw Raspbian image"
    exit 5
fi

sudo losetup /dev/loop${LOOPBACK} $WORKING_IMAGE
R=$?

if [ $R -ne 0 ]; the
    echo "Failed to find the appropriate loopback device"
    exit 6
fi

# this will ask sfdisk to expand the last parition
echo ", +" | sudo sfdisk -N 2 /dev/loop${LOOPBACK}

# dump current part table
sudo sfdisk -d /dev/loop${LOOPBACK} > part_table.txt
START_SECTOR=`grep type=83 part_table.txt | awk '{print $4;}' | tr -d ','`

# delete the old loop setup
sudo losetup -d /dev/loop${LOOPBACK}     

# then we want to resize 
sudo losetup -o $((START_SECTOR * SECTOR_SIZE)) /dev/loop${LOOPBACK} $WORKING_IMAGE
R=$?
if [ $R -ne 0 ]; then
    echo "Oh no, wasn't able to mount partition 2 of the working image"
    echo "Working image: $WORKING_IMAGE"
    echo "Loopback number: $LOOPBACK"
    exit 7
fi

# do the resize!
sudo e2fsck -f /dev/loop${LOOPBACK}
sudo resize2fs /dev/loop${LOOPBACK}

# and dismount, our job is done!
sudo losetup -d /dev/loop${LOOPBACK}

echo "All done - the image called ${WORKING_IMAGE} is ready to accept the build process"