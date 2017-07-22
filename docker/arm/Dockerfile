FROM hypriot/rpi-alpine:3.4
MAINTAINER Neil Clayton
LABEL version="1.0"

VOLUME /www
WORKDIR /www
COPY ./src/server/ /www

RUN apk update \
    && apk add bash python-dev libusb libusb-dev udev eudev-dev linux-headers usbutils py-pip gcc musl-dev cython-dev gcc g++ \
    && pip install --upgrade setuptools \
    && pip install --upgrade pip \
    && pip install hidapi \
    && pip install -r requirements.txt \
    && rm -rf /www/scripts /www/DEVELOPMENT.md /www/pypirc_template /www/setup.py \
    && apk del gcc g++ python-dev libusb-dev eudev-dev linux-headers gcc musl-dev cython cython-dev --purge

EXPOSE 5000

CMD [ "./start_gunicorn.sh" ]
