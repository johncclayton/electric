#!/usr/bin/env bash

BRANCH=master
TMP=/tmp/bootstrap
cd $TMP

curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_1.sh
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_2.sh
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_3.sh

chmod +x *.sh

./development_part_1.sh
