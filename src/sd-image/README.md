Setup
=====
Install the following support binaries that provide QEMU support

    sudo apt-get install binfmt-support qemu qemu-user-static make g++ libparted0-dev
    
Now go get piimg from GitHub

    git clone https://github.com/alexchamberlain/piimg
    
Build it

    cd piimg && make && sudo cp src/piimg /usr/local/bin/
    
Make sure that worked, check the piimg binary is indeed in the /usr/local/bin/ directory

    ls -l /usr/local/bin
    
Docker - You Need This
----------------------
Don't forget to install Docker on the build machine

    curl -fsSL https://get.docker.com | sh;
    
Copy a Raspbian Lite image to the build VM, I already downloaded a Lite .zip file to the Windows machine, and opened it in Explorer.  From there I was able to scp the .img file into the home directory of the builder VM.  The .img should reside in the electric/src/sd-image directory.

Dropbox
=======
The build process will optionally copy the resulting SD card image to Dropbox for sharing.  If you want this, install Dropbox on the Linux build box. 

The installer can be found here: https://www.dropbox.com/install-linux

For those of you lazy enough, the command you are looking for to install Dropbox onto your Debian system is: 

    cd ~ && wget -O - "https://www.dropbox.com/download?plat=lnx.x86_64" | tar xzf -
    sudo apt-get install python
    
Run Dropbox
-----------
Next, run the Dropbox daemon from the newly created .dropbox-dist folder.

    ~/.dropbox-dist/dropboxd

If you're running Dropbox on your server for the first time, you'll be asked to copy and paste a link in a working browser to create a new account or add your server to an existing account. Once you do, your Dropbox folder will be created in your home directory. 

Building an SD Image for the Raspberry Pi
=========================================

