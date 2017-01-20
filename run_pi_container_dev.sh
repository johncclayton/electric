#@IgnoreInspection BashAddShebang
docker run --restart=always -d --name electric-pi --privileged -v /dev/bus/usb:/dev/bus/usb -p 5000:5000 scornflake/electric-pi
