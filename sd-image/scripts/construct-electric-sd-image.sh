#!/bin/bash

if [ -z "$TRAVIS_BUILD_NUMBER" ]; then
        echo "I can't detect the TRAVIS_BUILD_NUMBER - aborting..."
        exit 13
fi

if [ -z "$BRANCH" ]; then
        echo "I can't detect the name of the branch - aborting..."
        exit 14
fi

echo "The build number is: $TRAVIS_BUILD_NUMBER"
echo "The branch is: $TRAVIS_BRANCH"

BRANCH="${TRAVIS_BRANCH}"

# check out electric
cd electric && git reset --hard HEAD && git pull && git checkout -f ${BRANCH}
if [ $? -ne 0 ]; then
        echo "Failure updating branch"
        exit 1
fi

# use terraform to fire up a host
cd sd-image/tf/aws
terraform init
terraform apply -auto-approve -var-file="../../../../buildkit.tfvars"
IP_ADDR=`terraform output buildkit_public_ip`

SSH="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o SendEnv=TRAVIS_BUILD_NUMBER -o SendEnv=TRAVIS_BRANCH -i $HOME/buildkit-eu-central-1.pem "

if [ $? -ne 0 ]; then
        echo "Something went wrong during Terraform"
        terraform destroy -auto-approve -var-file="../../../../buildkit.tfvars"
        exit 2
else
        $SSH root@$IP_ADDR "sed -i 's/AcceptEnv LANG LC_\*/AcceptEnv LANG LC_\* TRAVIS_BRANCH TRAVIS_BUILD_NUMBER/' /etc/ssh/sshd_config && sudo servicectl restart ssh.service"
        $SSH root@$IP_ADDR "apt-get update && apt-get install -y curl zip sudo"
fi

$SSH root@$IP_ADDR "curl -sL https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/sd-image/build-bootstrap.sh > ./setup.sh && chmod +x ./setup.sh && bash -x ./setup.sh"

exit $?
