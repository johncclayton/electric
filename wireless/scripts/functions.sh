#!/usr/bin/env bash

add_wlan1_if_not_there() {
    HAVE_WLAN1=$(iw dev | grep 'wlan1')
    if [ "${HAVE_WLAN1}x" = "x" ]; then
        echo "Adding in wlan1 AP interface..."
        iw dev wlan0 interface add wlan1 type __ap
    fi
    return 0;
}

check_firewall_forwarding_rules() {
    echo 1 >/proc/sys/net/ipv4/ip_forward

    HAVE_IP_RULES=$(iptables -S -t nat | grep wlan0)
    if [ "$HAVE_IP_RULES" != "-A POSTROUTING -o wlan0 -j MASQUERADE" ]; then
        echo "Adding in IP masquerade rules"
        iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE
        iptables -A FORWARD -i wlan0 -o wlan1 -m state --state RELATED,ESTABLISHED -j ACCEPT
        iptables -A FORWARD -i wlan1 -o wlan0 -j ACCEPT
    fi
}

reset_wlan0_supplicant_config() {
    local CFG_SSID="$1"
    local CFG_PWD="$2"
    cp /opt/wireless/scripts/wpa_supplicant_head.tpl /etc/wpa_supplicant/wpa_supplicant-wlan0.conf
    wpa_passphrase "$CFG_SSID" "$CFG_PWD" >> /etc/wpa_supplicant/wpa_supplicant-wlan0.conf

    # remove stupid config file - we should not have a global one
    rm /etc/wpa_supplicant/wpa_supplicant.conf
}

ask_question() {
    read -p "$1 [y/N]  " -n 1 -r
    echo $REPLY
}

copy_template() {
    template_str=$(cat $1)
    eval "echo >$2 \"${template_str}\""

}

function error() {
    ERR=$?
    echo $*
    exit $ERR
}

function check_error() {
	ERR=$1
	if [ $ERR -ne 0 ]; then        
		echo "error result: $*"
		exit $ERR
	fi
}

