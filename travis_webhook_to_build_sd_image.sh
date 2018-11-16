echo "The build number is: $TRAVIS_BUILD_NUMBER"
openssl aes-256-cbc -K $encrypted_00ede72e53d7_key -iv $encrypted_00ede72e53d7_iv -in travis_rsa.pem.enc -out ./travis_rsa.pem -d
chmod 0600 travis_rsa.pem

ssh -o StrictHostKeyChecking=no \
    -o SendEnv=TRAVIS_BUILD_NUMBER \
    -o SendEnv=TRAVIS_BRANCH \
    -i ./travis_rsa.pem \
    builder@coderage-software.com \
    "cd /home/builder/electric/sd-image && git reset --hard HEAD && git checkout -f $TRAVIS_BRANCH && ./create-image.sh"

