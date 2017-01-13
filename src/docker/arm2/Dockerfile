FROM hypriot/rpi-alpine
MAINTAINER Neil Clayton
LABEL version="1.0"

RUN apk update
RUN apk add python libusb usbutils

COPY server /www
EXPOSE 5000
COPY server/requirements.txt /www
WORKDIR  /www

# usbutils required to make the USB stuff work.
RUN apt-get update
RUN apt-get -y install usbutils

RUN pip install -r requirements.txt
ENTRYPOINT ["./run_server.sh"]