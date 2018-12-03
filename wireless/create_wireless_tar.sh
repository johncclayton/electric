#!/usr/bin/env bash
rm wireless.tar.gz 
tar czvf wireless.tar.gz --exclude .DS_Store ./etc ./scripts ./config
