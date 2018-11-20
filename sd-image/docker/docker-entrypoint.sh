#!/bin/bash

# ensure the repo is completely up to date
cd /buildkit/electric

git reset --hard HEAD
if [ $? -ne 0 ]; then
    echo "Failed to reset the repo content"
    exit 1
fi

# switch to the right branch
git checkout -f ${BRANCH}
if [ $? -ne 0 ]; then
    echo "Failed to checkout the branch: ${BRANCH}"
    exit 2
fi

# and we're all up to date
git pull
if [ $? -ne 0 ]; then
    echo "Failed to git pull after switching to branch ${BRANCH}"
    exit 1
fi

# run the build!
cd sd-image && ./create-image.sh
