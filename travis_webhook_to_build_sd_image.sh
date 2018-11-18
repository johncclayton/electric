echo "The build number is: $TRAVIS_BUILD_NUMBER"
echo "The branch is: $TRAVIS_BRANCH" 

if [ "unified-server" = "$TRAVIS_BRANCH" ]; then
	echo "Not building for other branches at this point"
	exit 5
fi

openssl aes-256-cbc -K $encrypted_00ede72e53d7_key -iv $encrypted_00ede72e53d7_iv -in travis_rsa.pem.enc -out ./travis_rsa.pem -d
chmod 0600 travis_rsa.pem

ssh -o StrictHostKeyChecking=no \
    -o SendEnv=TRAVIS_BUILD_NUMBER \
    -o SendEnv=TRAVIS_BRANCH \
    -i ./travis_rsa.pem \
    -p 4545 \
    builder@d1813.dyndns.org \
    "cd /buildkit/electric && git reset --hard HEAD && git checkout -f $TRAVIS_BRANCH && BRANCH=$TRAVIS_BRANCH ./create-image.sh"

