FROM hypriot/rpi-alpine
MAINTAINER Neil Clayton
LABEL version="1.0"

RUN apk update
# usbutils required to make the USB stuff work.
# added bash cos I'm lazy
RUN apk add python libusb usbutils py-pip bash

VOLUME /www
COPY server /www
EXPOSE 5000

COPY server/requirements.txt /www
WORKDIR  /www

RUN pip install -r requirements.txt

CMD ["./run_server.sh"]
