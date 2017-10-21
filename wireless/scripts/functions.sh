#!/usr/bin/env bash


ask_question() {
    read -p "$1 [y/N]  "  -n 1 -r
    return $REPLY
}
