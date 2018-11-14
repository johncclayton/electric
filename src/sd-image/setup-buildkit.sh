#!/bin/bash
sudo apt-get -y update
sudo apt-get install -y unzip binfmt-support qemu qemu-user-static make g++ curl git libparted0-dev

if [ ! -d "piimg"]; then
    git clone https://github.com/alexchamberlain/piimg

    pushd .
    cd piimg && make && sudo cp src/piimg /usr/local/bin/
    popd 
fi

if [ ! -x /usr/local/bin/piimg ]; then
    echo "Failed to find the piimg binary in the /usr/local/bin directory"
    exit 4
fi

# just in case you run this again, clean out the old stuff
rm *.zip
rm *.img

# download from here, following redirects.  
curl -O -J -L "https://downloads.raspberrypi.org/raspbian_lite_latest" 
export ZIP_FILENAME=`ls -1 *.zip`
unzip $ZIP_FILENAME && rm $ZIP_FILENAME
export IMG_FILENAME=`ls -1 *.img`
cp $IMG_FILENAME test.img

if [ ! -d electric ]; then
    git clone https://github.com/johncclayton/electric.git
else
    pushd .
    cd electric && git pull
    popd
fi

echo "Should be ready to go..."