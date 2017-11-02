import logging
import os
import json
import docker
import requests
import subprocess

from flask import request, redirect, url_for
from flask_restful import Resource

logger = logging.getLogger('electric.status.{0}'.format(__name__))

WEB_IMAGE_NAME = "johncclayton/electric-pi-web"
WORKER_IMAGE_NAME = "johncclayton/electric-pi-worker"
WEB_CONTAINER_NAME = "electric-web"
WORKER_CONTAINER_NAME = "electric-worker"

def image_name(name, tag):
    return str(name) + ":" + str(tag)

def get_last_deployed_version():
    (last_deploy, err, last_deploy_ret) = read_output_for(
        [script_path("get_last_deploy_version.sh")])
    if last_deploy_ret != 0:
        return 0
    return int(last_deploy.strip())


def script_path(name):
    return os.path.join("/opt/status/scripts", name)


def read_output_for(args, default_on_error=None):
    proc = subprocess.Popen(args, stdout=subprocess.PIPE)
    out, err = proc.communicate()
    if proc.returncode != 0:
        out = default_on_error
    return out, err, proc.returncode


class WiFiConnectionResource(Resource):
    def read_wpa_ssid_name(self):
        """Read contents of the wpa supplicant file to see what we are connected to"""
        return read_output_for([script_path("sudo_get_ssid_name.sh")])

    def read_wpa_ssid_psk(self):
        """Read contents of the wpa supplicant file to see what we are connected to"""
        return read_output_for([script_path("sudo_get_ssid_psk.sh")])

    def read_wifi_ipaddr(self):
        return read_output_for([script_path("get_ip_address.sh"), "wlan0"])

    def get(self):
        ssid_out, ssid_err, ssid_rtn = self.read_wpa_ssid_name()

        return {
            "SSID": ssid_out.strip("\n"),
            "EXIT_CODE": ssid_rtn,
            "EXIT_MSG": ssid_err.strip()
        }

    def put(self):
        ssid_value = request.json["SSID"]
        ssid_pwd = request.json["PWD"]

        if ssid_pwd is not None and ssid_value is not None and len(ssid_value) > 0 and len(ssid_value) > 0:
            out, err, rtn = read_output_for(
                [script_path("sudo_set_ssid.sh"), ssid_value, ssid_pwd])

            return {
                "SSID": ssid_value,
                "PSK": "********",
                "output": out,
                "error": err,
                "returncode": rtn
            }

        return redirect(url_for("wifi"))


class StatusResource(Resource):
    def __init__(self):
        self.docker_cli = docker.from_env()
        self.pull_json = None

    def _systemctl_running(self, name):
        return os.system("systemctl is-active %s > /dev/null" % (name,)) == 0

    def _systemctl_start(self, name):
        out, err, rtn = read_output_for(
            [script_path("sudo_systemctl_start.sh"), name])
        return rtn == 0

    def _systemctl_stop(self, name):
        out, err, rtn = read_output_for(
            [script_path("sudo_systemctl_stop.sh"), name])
        return rtn == 0

    def check_docker_image_exists(self, name):
        """Check if the docker images have been downloaded already"""
        try:
            self.docker_cli.images.get(name)
            return True
        except docker.errors.ImageNotFound:
            return False

    def check_docker_container_created(self, name):
        """Check if the container for the iCharger service has been created"""
        try:
            cont = self.docker_cli.containers.get(name)
            return True
        except docker.errors.NotFound:
            pass
        return False

    def check_docker_container_running(self, name):
        """Checks to see if the created container is actually running"""
        try:
            cont = self.docker_cli.containers.get(name)
            return cont.status == "running"
        except docker.errors.NotFound:
            pass
        return False

    def get_server_status(self):
        """Calls into the running container to obtain the status of the iCharger service"""
        return requests.get('http://127.0.0.1:5000/status').json()

    def post(self):
        try:
            json_dict = request.json
            run_electric_pi = json_dict["electric-pi.service"]["running"]
            if run_electric_pi:
                self._systemctl_start("electric-pi")
            else:
                self._systemctl_stop("electric-pi")

        except Exception:
            pass

        return redirect(url_for("status"))

    def get(self):
        # simply check for the correct configuration of required system resources and return this
        # in a dict
        res = dict()

        (wlan0, err, wlan0_ret) = read_output_for(
            [script_path("get_ip_address.sh"), "wlan0"], "wlan0 device not found")
        (wlan1, err, wlan1_ret) = read_output_for(
            [script_path("get_ip_address.sh"), "wlan1"], "wlan1 device not found")

        ver = get_last_deployed_version()

        res["services"] = {
            "dnsmasq": self._systemctl_running("dnsmasq"),
            "hostapd": self._systemctl_running("hostapd"),
            "electric-pi.service": self._systemctl_running("electric-pi"),
            "electric-pi-status.service": self._systemctl_running("electric-pi-status"),
            "docker": self._systemctl_running("docker"),
        }

        res["interfaces"] = {
            "wlan0": wlan0.strip(),
            "wlan1": wlan1.strip()
        }

        web_image_running = self.check_docker_container_running(WEB_CONTAINER_NAME)
        worker_image_running = self.check_docker_container_running(WORKER_CONTAINER_NAME)

        res["docker"] = {
            "last_deploy": ver,
            "web": {
                "image_name": image_name(WEB_IMAGE_NAME, ver),
                "container_name": WEB_CONTAINER_NAME,
                "image_exists": self.check_docker_image_exists(image_name(WEB_IMAGE_NAME, ver)),
                "container_created": self.check_docker_container_created(WEB_CONTAINER_NAME),
                "container_running": web_image_running
            },
            "worker": {
                "image_name": image_name(WORKER_IMAGE_NAME, ver),
                "container_name": WORKER_CONTAINER_NAME,
                "image_exists": self.check_docker_image_exists(image_name(WORKER_IMAGE_NAME, ver)),
                "container_created": self.check_docker_container_created(WORKER_CONTAINER_NAME),
                "container_running": worker_image_running
            }
        }

        server_status = {
            "exception": "the electric-pi docker containers are not running"
        }

        if web_image_running:
            server_status = self.get_server_status()

        res["server_status"] = server_status

        return res
