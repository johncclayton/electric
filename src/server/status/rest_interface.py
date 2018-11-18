import json
import logging
import os
import subprocess
import urllib2

import requests

from flask import request, redirect, url_for
from flask_restful import Resource
from werkzeug.exceptions import BadRequest

logger = logging.getLogger('electric.status.{0}'.format(__name__))


def image_name(name, tag):
    return str(name) + ":" + str(tag)


def read_wpa_ssid_name():
    """Read contents of the wpa supplicant file to see what we are connected to"""
    return read_output_for([script_path("sudo_get_ssid_name.sh")])


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
    def read_wifi_ipaddr(self):
        return read_output_for([script_path("get_ip_address.sh"), "wlan0"])

    def get(self):
        ssid_out, ssid_err, ssid_rtn = read_wpa_ssid_name()

        return {
            "SSID": ssid_out.strip(),
            "EXIT_CODE": ssid_rtn,
            "EXIT_MSG": ssid_err.strip() if ssid_err else None
        }

    def put(self):
        if not request.json:
            raise BadRequest("No JSON payload")

        if "SSID" not in request.json:
            raise BadRequest("No SSID in payload")

        if "PWD" not in request.json:
            raise BadRequest("No PWD in payload")

        ssid_value = request.json["SSID"]
        ssid_pwd = request.json["PWD"]

        if ssid_pwd is not None and ssid_value is not None and len(ssid_value) > 0 and len(ssid_value) > 0:
            out, err, rtn = read_output_for(
                [script_path("sudo_set_ssid.sh"), ssid_value, ssid_pwd])

            return {
                "SSID": ssid_value,
                "output": out,
                "error": err,
                "returncode": rtn
            }

        return redirect(url_for("wifi"))


class DeploymentResource(Resource):
    def put(self):
        if "version" not in request.json:
            raise BadRequest("No version in payload")

        version = request.json['version']

        (deploy_output, err, deploy_ret) = read_output_for(
            [script_path("upgrade_deployed_containers.sh"), version], "Redeployment failed")

        return {
            'result': deploy_output,
            'err': err,
            'code': deploy_ret
        }

    def get(self):
        url = "https://api.travis-ci.org/repos/johncclayton/electric/builds"
        request_headers = {
            'User-Agent': 'electric',
            'Accept': 'application/vnd.travis-ci.2+json'
        }

        try:
            logger.info("Getting status from {}".format(url))
            the_request = urllib2.Request(url, headers=request_headers)
            http_response = urllib2.urlopen(the_request)
            content = json.load(http_response)
            logger.info("Got content: {0}".format(content))

            builds = content['builds']
            if builds:
                for build in builds:
                    if build['state'] != 'passed':
                        continue

                    return {
                        'latest_build_at_travis': int(build['number'])
                    }
            else:
                return {
                    'error': 'No builds from travis'
                }

        except Exception, ex:
            logger.error("Failed to talk to travis to get version: {}".format(ex.message))
            return {
                'error': "{}".format(ex)
            }


class StatusResource(Resource):
    def __init__(self):
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

        last_deployed_version = get_last_deployed_version()

        res["services"] = {
            "dnsmasq": self._systemctl_running("dnsmasq"),
            "hostapd": self._systemctl_running("hostapd"),
            "electric-pi.service": self._systemctl_running("electric-web"),
            "electric-pi-worker.service": self._systemctl_running("electric-worker"),
            "electric-pi-status.service": self._systemctl_running("electric-status"),
            "docker":  False,
        }

        res["interfaces"] = {
            "wlan0": wlan0.strip(),
            "wlan1": wlan1.strip()
        }

        (ap_name, err, ap_name_ret) = read_output_for([script_path("sudo_get_ap_name.sh")], "not set")
        (ap_channel, err, ap_channel_ret) = read_output_for([script_path("sudo_get_ap_channel.sh")], "not set")

        ssid_out, ssid_err, ssid_rtn = read_wpa_ssid_name()

        res["access_point"] = {
            "name": ap_name.strip(),
            "channel": ap_channel.strip(),
            "wifi_ssid": ssid_out.strip()
        }

        server_status = {
            "exception": "the electric-pi web service is not running"
        }

        if web_image_running:
            server_status = self.get_server_status()

        res["server_status"] = server_status

        return res


#
# This is here so as to not cause a recursive module import
#

