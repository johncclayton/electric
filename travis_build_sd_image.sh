echo "The build number is: $TRAVIS_BUILD_NUMBER"
echo "The branch is: $TRAVIS_BRANCH" 

# decode the key, using secrets embedded in the travis account
openssl aes-256-cbc -K $encrypted_00ede72e53d7_key -iv $encrypted_00ede72e53d7_iv -in travis_rsa.pem.enc -out ./travis_rsa.pem -d
chmod 0600 travis_rsa.pem

# not until I prove the copy command works
exit 5

ssh -o StrictHostKeyChecking=no \
    -o SendEnv=TRAVIS_BUILD_NUMBER \
    -o SendEnv=TRAVIS_BRANCH \
    -i ./travis_rsa.pem \
    -p 4545 \
    john@d1813.dyndns.org \
    "curl -sL https://raw.githubusercontent.com/johncclayton/electric/${TRAVIS_BRANCH}/sd-image/scripts/construct-electric-sd-image.sh > ./construct-electric-sd-image.sh && chmod +x ./construct-electric-sd-image.sh && bash -x ./construct-electric-sd-image.sh"

