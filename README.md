# Build Job Status
[![Build Status](https://travis-ci.org/johncclayton/electric.svg?branch=master)](https://travis-ci.org/johncclayton/electric)

# What is this thing?
Electric is a project that allows you to control your iCharger from your mobile phone (iOS / Android, windows what?) - regardless of whether you are at home or at the field.

This GitHub project provides the server software to control the iCharger 308/406/4010 DUO from a mobile app - and the server software *only* runs on a Raspberry Pi 3.

# So why should I use this?
Well, that's pretty easy to explain - here's our list of unique selling points:
  1. It looks great on your phone.
  1. It's got wow factor - use your iCharger from your deck chair while at the field.
  1. Set up new / existing presets, charge, discharge and store your packs - all from said deck chair.
  1. Use the app at the field as well as on your home WIFI network.

# Download a Raspberry Pi image
TODO: Dropbox is dead, long live Google Drive or something
TODO: Need to link to the latest download + instructions for installing / controlling it. 

# Installation
[Instructions to help you install the software on your Raspberry Pi 3.](https://docs.google.com/document/d/12vy4kCue40k26qsqJIa6b5kwuOIhKOWrTJteruaGcJk/edit?usp=sharing)

## Pictures or it never happened!

![Demo](/docs/images/teaser.gif "Charge Demo!")

# Quickstart Reference

Makes it easier to find the bootstrapping code, these are all in the appropriate README.md files in other
subdrectories of the repo. 

## Bootstrap the build machine

    bash <(curl -sL https://raw.githubusercontent.com/johncclayton/electric/master/sd-image/build-bootstrap.sh)

## Create an SD Image

    export BRANCH=master
    export TRAVIS_BUILD_NUMBER=683
    cd /buildkit/electric
    git checkout -t origin/${BRANCH}
    cd /buildkit/electric/sd-image
    ./create-image.sh

## Bootstrap a RPI3 directly

    bash <(curl -sL https://raw.githubusercontent.com/johncclayton/electric/master/development/rpi3-bootstrap.sh)
