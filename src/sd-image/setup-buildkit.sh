#!/bin/bash
sudo apt-get -y update
sudo apt-get install -y unzip binfmt-support qemu qemu-user-static make g++ curl git libparted0-dev

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

function find_loopback() {
    N=0
    FOUND=0
    while [ $FOUND -ne 0 ]; do
        sudo losetup /dev/loop$N
        FOUND=$?
        N=eval 
    done
}

export SECTOR_SIZE=`fdisk -l $WORKING_IMAGE | grep 'Sector size' | awk '{print $7;}'`

echo "Should be ready to go, check that $WORKING_IMAGE is 1G larger than the original"