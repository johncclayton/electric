#!/usr/bin/env bash

# TODO: rename and ensure it works given the context of status server and tell Neil what it now does

[ "root" != "$USER" ] && exec sudo $0 "$@"

export VERSION_TAG=":$1"

# TODO: fix this - this is upgrade logic called from the app - check with Neil? 

#echo >/opt/LAST_DEPLOY $1

