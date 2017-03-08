#!/bin/bash
/sbin/iw dev | /bin/grep uap0 
RES=$?
if [ $RES -ne 0 ]; then
	echo "Adding uap0 interface..."
	/sbin/iw dev wlan0 interface add uap0 type __ap
fi

