echo "The build number is: $TRAVIS_BUILD_NUMBER"
echo "The branch is: $TRAVIS_BRANCH" 

# decode the key, using secrets embedded in the travis account
openssl aes-256-cbc -K $encrypted_00ede72e53d7_key -iv $encrypted_00ede72e53d7_iv -in travis_rsa.pem.enc -out ./travis_rsa.pem -d
chmod 0600 travis_rsa.pem

# break this until I'm done.
exit 5

ssh -o StrictHostKeyChecking=no \
    -o SendEnv=TRAVIS_BUILD_NUMBER \
    -o SendEnv=TRAVIS_BRANCH \
    -i ./travis_rsa.pem \
    -p 4545 \
    john@d1813.dyndns.org \
    "./construct_electric_sd_image.sh"

