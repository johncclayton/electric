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

cp $IMG_FILENAME test.img

if [ ! -d electric ]; then
    git clone https://github.com/johncclayton/electric.git
else
    pushd .
    cd electric && git pull
    popd
fi

echo "Should be ready to go..."