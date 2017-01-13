FROM python:2.7
MAINTAINER Neil Clayton
LABEL version="1.0"
COPY server /www
EXPOSE 5000
COPY server/requirements.txt /
RUN pip install -r requirements.txt
WORKDIR  /www
ENTRYPOINT ["./run_server.sh"]