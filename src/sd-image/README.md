Creating a Build Box
====================
The build box is constructed using Terraform.  To deploy your own sd-image build system, you will need an 
AWS account, and the access keys to it.  More documentation for this is available on the Terraform website. 

Checklist: 
1.  An AWS account with appropriate access
1.  The latest Terraform binary for your platform.
1.  A .tfvars file called anything you like; I will assume buildkit.tfvars for this documentation.

Assuming all that's done, you need to fire up the AWS instance.  To do so, run the following commands from the tf/ directory. 

Hint: NEVER check your buildkit.tfvars file into source control - that contains your secrets!

What's included?
----------------

When Terraform is used to construct a build box; you will get: 
1. An AWS instance with enough space to hold a single image (customize via aws_instance_type)
1. A fully prepared Raspbian image - the second partition of this image has been expanded by 1G in order to provide space for all the things that get installed on it. 
1. Appropriate scripts placed into the home directory that can be used to rebuild the sd-image. 

How do I do it?
---------------

1.  terraform init
1.  terraform plan -var-file=<location of buildkit.tfvars>
1.  terraform apply -var-file=<location of buildkit.tfvars>

Wait for a few minutes, eventually you'll be presented with the public DNS as we as IPv4 address of the build machine.  You're ready to build!

Building an SD Image for the Raspberry Pi
=========================================
To create an SD card image, you'll just need to get access to the build machine and run a script. 

Something like this would do it: 

    ./create-image.sh 

That will fail, because you MUST specific WIFI SSID and credentials in a .config file that should be in the src/sd-image directory - you will need to create this file, the contents should be along these lines:

    WIFINAME=<name/SSID of your WIFI access point>
    WIFIPWD=<password for the above>
    
 Now run it again and things should be great.  It WILL prompt you for your password, this is sudo at work on behalf of piimg.
    
If the stars are aligned, you end up with a complete SD image at /tmp/john.img and it'll also be copied to the ~/Dropbox/Public/ folder.
