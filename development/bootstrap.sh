#!/usr/bin/env bash

BRANCH=unified-server
T=$TEMP/bootstrap
cd $T

curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_1.sh
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_2.sh
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_3.sh

chmod +x *.sh

./development_part_1.sh
