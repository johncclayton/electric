FROM hypriot/rpi-alpine:3.4
MAINTAINER Neil Clayton
LABEL version="1.0"

RUN apk update \
    && apk add bash python-dev libusb libusb-dev udev eudev-dev linux-headers usbutils py-pip gcc musl-dev cython-dev \
    && pip install --upgrade setuptools \
    && pip install --upgrade pip \
    && pip install hidapi \
    && pip install electric \
    && apk del libusb-dev python-dev eudev-dev linux-headers gcc musl-dev cython-dev --purge

EXPOSE 5000

CMD [ "gunicorn", "--preload", "--bind=0.0.0.0:5000", "--workers=1", "--max-requests=50", "--backlog=300", "electric.wsgi:application" ]
