#!/usr/bin/env bash


ask_question() {
    read -p "$1 [y/N]  " -n 1 -r
    echo $REPLY
}

copy_template() {
    template_str=$(cat $1)
    eval "echo >$2 \"${template_str}\""

}