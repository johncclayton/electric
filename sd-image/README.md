# Build Box

The recommended, repeatable approach to building the sd-image is to use an Ubuntu server created via our Terraform configuration - but honestly any Ubuntu server will do, however you'll have to deal with any variances to our recommended setup on your own.

The compute requirements for the build box are extremely modest; more or less it is a low powered linux host (t2.micro is the default) with about 20g disk which allows multiple copies of the Raspbian image files to co-exist.

If you want to use your own Ubuntu server jump to the "Buildbox Preparation" section below.

## Why Terraform

Building the SD image is a non-trivial process - using Terraform allows us to lock the best configuration in place, maintain this configuration in 'code' resulting in a repeatable experience with less surprises - all _GREAT_ things when it comes to infrastructure.

When it comes to creating and running infrastructure boring and predictable is good.

We use AWS - you will need the following:

1. An AWS account with appropriate permissions to create resources.
1. The latest Terraform binary for your platform.
1. A .tfvars file containing your credentials for the AWS instance along with your preferences for the project_name (more below).

## Security

There are some important things to know about how the instance is created.

- The instance is created in its own VPC so that it cannot impact anything else in your AWS environment.
- The only way the instance can be reached is via SSH.

### AWS Regions

The .tf files assume/default to the **eu-west-1** region (Ireland).  

This is only important if you want to change the AMI being deployed; as these are region specific.  Please keep this in mind if you login your AWS console and you don't see the resources!

### buildkit.tfvars

The .tfvars file stores your secrets and preferences.  It is something you need to create and should _never_ be checked in and thus is usually also placed outside of the Git repository.

Populate the file as shown below - obviously fill in the AWS information from your account.

    aws_access_key = "<associated with your AWS account>"
    aws_secret_key = "<associated with your AWS account>"
    ssh_key_name = "your AWS key name"
    project_name = "buildkit testing"

For more information on the different things you can change, check the tf/variables.tf file.

#### ssh_key_name

The variable *ssh_key_name* refers to an _existing_ AWS Key/Pair resource.  These are just SSL key/pairs, and have a unique name in the region you are deploying to.  Copy the name of the Key/Pair into your configuration and then you'll be able to use the SSH identity arg to log into the instance - if you don't do this you can't login to the instance.

#### project_name

The variable *project_name* will be applied as a tag to all the resources that are created by Terraform.  This is so that afterwards you can still tell what resources belong to the Electric bild box - please put whatever you want into the project_name that will help you remember what the resources are for.

### Creating the build box instance

**WARNING**: _**NEVER**_ check in your buildkit.tfvars file nor your terraform.tfstate file into source control as these two files contain your secrets!

Initialise Terraform once - this downloads the required provider plugins.

    $ cd sd-image/tf
    $ terraform init

To deploy the instance:

    $ cd sd-image/tf
    $ terraform apply -var-file=<location of buildkit.tfvars>

Eventually you'll be greeted with output similar to the following:

```
Apply complete! Resources: 9 added, 0 changed, 0 destroyed.                 
                                                                            
Outputs:                                                                    
                                                                            
aws_buildkit_public_dns = ec2-34-249-193-177.eu-west-1.compute.amazonaws.com
aws_buildkit_public_ip = 34.249.193.177                           
```

Congratulations - you now have a machine installed into it's own VPC capable of building the sd-card image!

#### SSH / Login

Remember the **aws_key_name** variable you set up in the .tfvars file?  Use this to log into the instance using SSH.

Using the above output as an example, heres how you use the identity file to log into the newly created instance:

    $ ssh ubuntu@34.249.193.177 -i ../../name-of-keyfile.pem

_NOTE_: this of course assumes the file you saved from your Amazon console was called _name-of-keyfile.pem_.

## Buildbox Preparation

If you are not using Terraform, this is where you start on a linux host of your choice.  

The scripts are written with Ubuntu in mind, require apt-get / stretch and anything else is on you :-).

Preparation is intended to be a one-off step that installs a bunch of open source software and pulls down the right Raspbian Lite image - here's a bit more detail:

1. Get the latest version of Raspbian from the official site.
1. Add some space to that image file - by default they are too small for all the things we need to install on it. 
1. Adjust the last partition within said image file to use this new space.
1. Resize the filesystem on the last partition to the maximum.

To kick off the preparation script - run the following command (_hint_: change the word _master_ in the curl command below to target a different branch):

    $ export BRANCH=unified-server
    $ curl -sL https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/sd-image/build-bootstrap.sh > setup.sh
    $ chmod +x setup.sh
    $ bash -x ./setup.sh

Or for the adventurous this is the same script but it's not stored on disk:

    $ export BRANCH=unified-server
    $ bash <(curl -sL https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/sd-image/build-bootstrap.sh)

You'll see [quite a lot of stuff happen](https://google.com&q=understatement).  If there are problems, look at the script - its well documented  - because I will absolutely forget what it's doing in 1 month.

## Finally - building an SD Image

Finally - we are here, building an image!

You'll need to tell the build system which branch and which build number you want to build for.  This is done using environment variables.

| Variable Name | Example Value |
|---------------|----------------|
| BRANCH        | master         |
| TRAVIS_BUILD_NUMBER              | 467               |

The build process will use these details in the resulting filename, as a way of ensuring that its clear where the image came from and it's place in the grand scheme of events in the timeline of development - you know, it's place in the world.

Something like this would do it - create_image.sh is used to run the SD image build process:

    export BRANCH=unified-server
    export TRAVIS_BUILD_NUMBER=683
    cd /buildkit/electric
    git checkout -t origin/${BRANCH}
    cd /buildkit/electric/sd-image
    ./create-image.sh

I.T. gods willing, you'll be presented with something along the following lines

    Your SD Image build was a complete success, huzzzah!
    Burn this image to an SD card: /tmp/electric-master-683.img

## What happened?

The SD image that the buildbox produces is suitable for use by end users.  

To start using the image (no dev required); you'd simply burn it to an SD card and fire it up in a Raspberry Pi - no additional package installations required, no internet access required, no waiting.  We felt it was important to make the end user experience as simple as possible.

The SD image is also suitable as a development environment - in fact that's pretty much what the build process did - it used the development/rpi3-bootstrap.sh script to get almost everything set up.

For more information on how to complete a development environment with remote debugging, code sync, and so on - take a look at development/README.md.

Thanks and have fun!
