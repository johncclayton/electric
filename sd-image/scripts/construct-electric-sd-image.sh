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
$SSH $REMOTE_USER@$IP_ADDR "cd /buildkit/electric && git reset --hard HEAD && git pull && git checkout -f ${TRAVIS_BRANCH} && cd sd-image && ./create-image.sh"
# TODO: get the image off the box into the NAS

# clean up the buils box
cd $HOME/electric/sd-image/tf/aws
terraform destroy -auto-approve -var-file="../../../../buildkit.tfvars"

exit $?
