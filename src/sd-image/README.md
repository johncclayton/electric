Terraform Build Box
===================
The build box is constructed using Terraform.  To deploy your own sd-image build system, you will need an 
AWS account, and the access keys to it.  More documentation for this is available on 
the Terraform website.  

The requirements for the build box are extremely simple; more or less "one linux machine, hold the desktop
with some extra GB disk space - 20 is roughly a more than enough number".

Checklist: 
1.  An AWS account with appropriate access for using Terraform.
1.  The latest Terraform binary for your platform.
1.  A .tfvars file called anything you like; I will assume buildkit.tfvars for this documentation.

Setting up .tfvars
==================
You'll need at least two variable values, as shown below. 

aws_access_key = "<associated with your AWS account>"
aws_secret_key = "<associated with your AWS account>"
project_name = "buildkit testing"

The last one is worth mentioning - the value of "project_name" is applied as a tag to all the resources so that after 1 month, when you've forgotten all about the fact that you left a build server running - you can still tell it belongs to the buildkit. 

What's included?
================

When Terraform is used to construct a build box; you will get: 
1. An AWS instance with enough space to hold a single image (customize via aws_instance_type)
1. A fully prepared Raspbian image - the second partition of this image has been expanded by 1G in order to provide space for all the things that get installed on it. 
1. Appropriate scripts placed into the home directory that can be used to rebuild the sd-image. 

Running Terraform
=================
To create your build instance - run the terraform command from the src/sd-image/tf/ directory.  Terraform state is NOT written to a shared location, that is an "exercise for the reader".

Hint: NEVER check your buildkit.tfvars file nor your terraform.tfstate files into source control - that contains your secrets!

Here's what you do: 

1.  terraform init
1.  terraform plan -var-file=<location of buildkit.tfvars>
1.  terraform apply -var-file=<location of buildkit.tfvars>

Wait for a few minutes, eventually you'll be presented with the public DNS as we as IPv4 address of the build machine.  You're ready to build!

Setting up the Instance
=======================
You need SSH instance access to the machine for the following work.  This is one-off preparation that 
prepares a Raspbian image ready for the build job.  

The preparation steps are automated; and roughly speaking do the following: 

1. Download the latest version of Raspbian from the official site
1. Adds 2Gig to the image file 
1. Adjusts the last partition within the image file to use this new space
1. Resizes the filesystem on the last partition to make use of this new space

Run the following command: 

    $ curl -sL https://raw.githubusercontent.com/johncclayton/electric/master/src/sd-image/setup-buildkit.sh > setup.sh
    $ chmod +x setup.sh
    $ bash -x ./setup.sh

You'll see quite a lot of stuff happen.  If there are problems, look at the setup.sh script - its well
documented (because I will absolutely forget what it's doing in 1 month).

Success is when the working image has been created and correctly re-partitioned as well as the last
filesystem on that partition being resized.

Creating an SD Image
====================
To create an SD card image, you'll just need to get access to the build machine and run a script. 

Something like this would do it: 

    ./create-image.sh 

