echo "The build number is: $TRAVIS_BUILD_NUMBER"
echo "If only this would work"
openssl aes-256-cbc -K $encrypted_00ede72e53d7_key -iv $encrypted_00ede72e53d7_iv -in travis_rsa.pem.enc -out ./travis_rsa.pem -d 
chmod 0600 travis_rsa.pem 
ssh -o StrictHostKeyChecking=no -i ./travis_rsa.pem builder@coderage-software.com "cd /home/builder/electric/src/sd-image && git pull && ./create-image.sh" 
