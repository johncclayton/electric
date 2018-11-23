#!/bin/bash

SETUP_ROOT=/buildkit
sudo mkdir -p ${SETUP_ROOT} && sudo chmod 777 ${SETUP_ROOT}
cd ${SETUP_ROOT}

sudo apt-get -y update
sudo apt-get install -y unzip binfmt-support qemu qemu-user-static make g++ curl git libparted0-dev

if [ ! -d "piimg" ]; then
    git clone https://github.com/johncclayton/piimg.git
fi

if [ -d "piimg" ]; then
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
echo "Removing existing .img files in $SETUP_ROOT"
rm *.img

# find any existing file - potentially nothing of course.
ZIP_FILENAME=`ls -1 *.zip`

# only download if the ZIP file isn't there.
# TODO: we want to PIN the download to a specific version, but be notified when a new release is discovered.
echo "Downloading the Raspbian release..."
if [ -z "$ZIP_FILENAME" ]; then
    # download from here, following redirects.  
    curl -O -J -L "https://downloads.raspberrypi.org/raspbian_lite_latest" 
    ZIP_FILENAME=`ls -1 *.zip`
fi

if [ ! -f "$ZIP_FILENAME" ]; then
    echo "Failure to detect the ZIP file from Raspbian - was looking for $ZIP_FILENAME"
    exit 5
fi

echo "Unzipping Raspbian release..."
unzip -o $ZIP_FILENAME 
IMG_FILENAME=`ls -1 *raspbian*.img`

echo "Copying latest image to a working image..."
export WORKING_IMAGE=$SETUP_ROOT/template-image.img
cp $IMG_FILENAME $WORKING_IMAGE

# echo "Checking if our setup directory contains a copy of the code..."
# if [ ! -d ${SETUP_ROOT}/electric ]; then
#     echo "Downloading a copy of the electric git repo"
#     git clone https://github.com/johncclayton/electric.git
# else
#     pushd .
#     cd electric && git pull
#     popd
# fi

echo "Beginning partition adjustment of the working image: $WORKING_IMAGE"

export LOOPBACK=`losetup -f | sed s,/dev/loop,,`
echo "Discovered loopback is: ${LOOPBACK} (this should be an integer)"
if [ ${LOOPBACK} -le 0 -o ${LOOPBACK} -gt 99 ]; then
    echo "Unable to find a suitable/available loopback device - which is needed to manipulate the partition table of the raw Raspbian image"
    exit 6
fi

export SECTOR_SIZE=`fdisk -l $WORKING_IMAGE | grep 'Sector size' | awk '{print $7;}'`

# simple validation; if this isn't true then parsing is likely wrong
if [ 512 -ne $SECTOR_SIZE ]; then
    echo "Parsing the sector size didn't seem to work - aborting through abject fear"
    exit 4
fi

if [ -z "$SECTOR_SIZE" ]; then                                                                 
    echo "Parsing the sector size didn't seem to work - aborting through abject fear"          
    exit 5                                                                                     
fi                                                                                             

echo "Sector size: ${SECTOR_SIZE}"
echo "Using loopback: ${LOOPBACK}"

# adds 2gig to the working image, should be enough extra space to install bins/code/etc.
echo "Adding 1.5 Gb extra space to the working image..."
truncate -s +$((2929687 * 512)) $WORKING_IMAGE

echo
echo "Expanding the 2nd partition"
sudo losetup /dev/loop${LOOPBACK} $WORKING_IMAGE
R=$?

if [ $R -ne 0 ]; then
    echo "Failed to find the appropriate loopback device"
    exit 7
fi

# this will ask sfdisk to expand the last parition
echo ", +" | sudo sfdisk -N 2 /dev/loop${LOOPBACK}

# dump current part table, and find the start sector - this is most notably a shaky part of the 
# whole deal.  
echo
echo "Dumping current partition table to work out the start sector"
sudo sfdisk -d /dev/loop${LOOPBACK} > part_table.txt
START_SECTOR=`grep type=83 part_table.txt | awk '{print $4;}' | tr -d ','`

# delete the old loop setup
sudo losetup -d /dev/loop${LOOPBACK}     

echo 
echo "Start sector: ${START_SECTOR}"

# then we want to resize 
sudo losetup -o $((START_SECTOR * SECTOR_SIZE)) /dev/loop${LOOPBACK} $WORKING_IMAGE
R=$?
if [ $R -ne 0 ]; then
    echo "Oh no, wasn't able to mount partition 2 of the working image"
    echo "Working image: $WORKING_IMAGE"
    echo "Loopback number: $LOOPBACK"
    exit 8
fi

# do the resize!
echo 
echo "Mounted the second partition, checking & resizing now"
sudo e2fsck -f -y /dev/loop${LOOPBACK}
sudo resize2fs /dev/loop${LOOPBACK}

# and dismount, our job is done!
sudo losetup -d /dev/loop${LOOPBACK}

echo 
echo "DONE - the image called ${WORKING_IMAGE} is ready to be used as input to the build process"
echo

