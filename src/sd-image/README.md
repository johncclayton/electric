Creating a Build Box
====================
The build box is constructed using Terraform.  To deploy your own sd-image build system, you will need an 
AWS account, in particular the AWS_SECRET_

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
    
Important - add a docker user so that its possible to run docker without root/sudo privs, e.g.:

    sudo usermod -aG docker builder
    
Note: you'll need to log out and log back in.

Raspbian Lite Image - You Need This
-----------------------------------
Copy a Raspbian Lite image to the build VM, I already downloaded a Lite .zip file to the Windows machine, and opened it in Explorer.  From there I was able to scp the .img file into the home directory of the builder VM.  The .img should reside in the electric/src/sd-image directory.

Dropbox - Optional
------------------
The build process will optionally copy the resulting SD card image to Dropbox for sharing.  If you want this, install Dropbox on the Linux build box. 

The installer can be found here: https://www.dropbox.com/install-linux

For those of you lazy enough, the command you are looking for to install Dropbox onto your Debian system is: 

    cd ~ && wget -O - "https://www.dropbox.com/download?plat=lnx.x86_64" | tar xzf -
    sudo apt-get install python
    
Next, run the Dropbox daemon from the newly created .dropbox-dist folder.

    ~/.dropbox-dist/dropboxd

If you're running Dropbox on your server for the first time, you'll be asked to copy and paste a link in a working browser to create a new account or add your server to an existing account. Once you do, your Dropbox folder will be created in your home directory. 

Building an SD Image for the Raspberry Pi
=========================================
To create an SD card image, you will need the Raspbian Lite image in the src/sd-image directory (but you did that already right?), and credentials to an existing WIFI network - because the creation process burns these creds into the SD image setup. 

Something like this would do it: 

    ./create-image.sh 2017-09-07-raspbian-stretch-lite.img /tmp/john.img

That will fail, because you MUST specific WIFI SSID and credentials in a .config file that should be in the src/sd-image directory - you will need to create this file, the contents should be along these lines:

    WIFINAME=<name/SSID of your WIFI access point>
    WIFIPWD=<password for the above>
    
 Now run it again and things should be great.  It WILL prompt you for your password, this is sudo at work on behalf of piimg.
    
If the stars are aligned, you end up with a complete SD image at /tmp/john.img and it'll also be copied to the ~/Dropbox/Public/ folder.
