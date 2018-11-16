echo "The build number is: $TRAVIS_BUILD_NUMBER"

# TODO: Build the PyPi electric image and push into their repo.
# TODO: Work out how to increment a version number in test, and how does PyPi host such a test? 
# TODO: Does PyPi even NEED to have the test versions with such a build system? 

#cd src/server
#python scripts/distribute.py -p -P 