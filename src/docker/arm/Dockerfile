FROM hypriot/rpi-python:2.7
MAINTAINER Neil Clayton
LABEL version="1.0"
COPY server /www
EXPOSE 5000
COPY server/requirements.txt /www
WORKDIR  /www

# usbutils required to make the USB stuff work.
RUN apt-get update
RUN apt-get -y install usbutils

RUN pip install -r requirements.txt
ENTRYPOINT ["./run_server.sh"]