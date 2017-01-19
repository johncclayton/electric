FROM hypriot/rpi-alpine
MAINTAINER Neil Clayton
LABEL version="1.0"

RUN apk update && apk add bash python-dev libusb libusb-dev udev eudev-dev linux-headers usbutils py-pip gcc musl-dev cython-dev
RUN pip install --upgrade setuptools && pip install --upgrade pip
RUN pip install hidapi

VOLUME /www

COPY src/server /www
EXPOSE 5000

COPY src/server/requirements.txt /www
WORKDIR  /www

RUN pip install -r requirements.txt

CMD ["./start_gunicorn.sh" ]
