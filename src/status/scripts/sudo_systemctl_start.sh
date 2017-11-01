#!/usr/bin/env bash
[ "root" != "$USER" ] && exec sudo $0 "$@"
sudo systemctl start "$1"