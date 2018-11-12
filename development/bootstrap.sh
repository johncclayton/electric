#!/usr/bin/env bash

export BRANCH=unified-server
T=/tmp/electric-bootstrap

if [ ! -d $T ];
    mkdir -p "$T"
fi

cd $T

curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_1.sh
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_2.sh
curl --remote-name --location https://raw.githubusercontent.com/johncclayton/electric/${BRANCH}/development/development_part_3.sh

chmod +x *.sh

./development_part_1.sh
