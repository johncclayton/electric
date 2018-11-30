#!/bin/bash

echo "Validate electric is at home..."
ELECTRIC=$HOME/electric
if [ ! -d $ELECTRIC ]; then
    echo "Electric source is expected to be here (and it isnt): $ELECTRIC"
    exit 1
fi

source $ELECTRIC/wireless/scripts/functions.sh

echo "Validate that the /opt/LAST_DEPLOY is present"
[ -d /opt ] || error "no /opt directory"