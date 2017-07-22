FROM hypriot/rpi-alpine:3.4
MAINTAINER Neil Clayton
LABEL version="1.0"

RUN apk update \
    && apk add bash python-dev libusb libusb-dev udev eudev-dev linux-headers usbutils py-pip gcc musl-dev cython-dev gcc \
    && pip install --upgrade setuptools \
    && pip install --upgrade pip \
    && pip install hidapi \
    && apk del libusb-dev python-dev eudev-dev linux-headers gcc musl-dev cython cython-dev --purge

RUN apk add gcc

VOLUME /www
WORKDIR /www

COPY ./src/server/ /www
RUN pip install -r requirements.txt && rm -rf /www/scripts /www/DEVELOPMENT.md /www/pypirc_template /www/setup.py

EXPOSE 5000

CMD [ "./start_gunicorn.sh" ]
