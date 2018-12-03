#!/bin/bash

if [ -z "$TRAVIS_BUILD_NUMBER" ]; then
        echo "I can't detect the TRAVIS_BUILD_NUMBER - aborting..."
        exit 13
fi

if [ -z "$TRAVIS_BRANCH" ]; then
        echo "I can't detect the name of the branch - aborting..."
        exit 14
fi

echo "The build number is: $TRAVIS_BUILD_NUMBER"
echo "The branch is: $TRAVIS_BRANCH"

# check out electric
cd electric && git reset --hard HEAD && git pull && git checkout -f ${TRAVIS_BRANCH}
if [ $? -ne 0 ]; then
        echo "Failure updating branch"
        exit 1
fi

# use terraform to fire up a host
cd sd-image/tf/aws
terraform init
terraform apply -auto-approve -var-file="../../../../buildkit.tfvars"
TA=$?

echo "Waiting 30 seconds for the stars to align and the sirens to stop..."
sleep 30 

REMOTE_USER=ubuntu
IP_ADDR=`terraform output buildkit_public_ip`
SSH="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o SendEnv=TRAVIS_BUILD_NUMBER -o SendEnv=TRAVIS_BRANCH -i $HOME/buildkit-eu-west-1.pem "

if [ $TA -ne 0 ]; then
        echo "Something went wrong during Terraform"
        terraform destroy -auto-approve -var-file="../../../../buildkit.tfvars"
        exit 2
else
        $SSH $REMOTE_USER@$IP_ADDR "sudo apt-get update && sudo apt-get install -y curl zip"
        $SSH $REMOTE_USER@$IP_ADDR "sudo sed -i 's/AcceptEnv LANG LC_\*/AcceptEnv LANG LC_\* TRAVIS_BRANCH TRAVIS_BUILD_NUMBER/' /etc/ssh/sshd_config && sudo systemctl restart ssh.service"
fi

# prepare the build box
$SSH $REMOTE_USER@$IP_ADDR "curl -sL https://raw.githubusercontent.com/johncclayton/electric/${TRAVIS_BRANCH}/sd-image/build-bootstrap.sh > ./setup.sh && chmod +x ./setup.sh && bash -x ./setup.sh"
# exec the build once
$SSH $REMOTE_USER@$IP_ADDR "curl -sL https://raw.githubusercontent.com/johncclayton/electric/${TRAVIS_BRANCH}/sd-image/create-image.sh > ./create-image.sh && chmod +x ./create-image.sh && ./create-image.sh"

CREATE_IMAGE_RES=$?
echo "Status of create-image.sh call on remote host: $CREATE_IMAGE_RES"

# get the image off the AWS box.
cd $HOME
SOURCE_DIR="/buildkit/${TRAVIS_BRANCH}/${TRAVIS_BUILD_NUMBER}"
SOURCE_IMAGE="electric-${TRAVIS_BRANCH}-${TRAVIS_BUILD_NUMBER}.img"
SOURCE_IMAGE_SUCCESS="electric-${TRAVIS_BRANCH}-${TRAVIS_BUILD_NUMBER}.img-success"

# get the .img file off the build machine (that is about to be destroyed)
scp -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -i $HOME/buildkit-eu-west-1.pem $REMOTE_USER@$IP_ADDR:$SOURCE_DIR/$SOURCE_IMAGE_SUCCESS .

# great - it's now on the Linux host - the d1813 system will pick it up shortly (5 min cron job).
if [ $? -eq 0 ]; then
        mv ${SOURCE_IMAGE_SUCCESS} $HOME/images/${SOURCE_IMAGE} 
else
        rm ${SOURCE_IMAGE_SUCCESS}
fi

# keep the last 3 of each branch type...
cd $HOME/images
ls -tp electric-${TRAVIS_BRANCH}-* | grep -v '/$' | tail -n +3 | xargs -I {} rm -- {}

# clean up the buildssh  box
cd $HOME/electric/sd-image/tf/aws
terraform destroy -auto-approve -var-file="../../../../buildkit.tfvars"

exit $?
