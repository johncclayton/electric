#@IgnoreInspection BashAddShebang
docker run -it --rm --privileged -v /dev/bus/usb:/dev/bus/usb -v $PWD/src/server:/www -p 5000:5000 scornflake/electric-pi ./run_server.sh --unicorns
