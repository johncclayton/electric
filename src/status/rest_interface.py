import logging
import os
import docker
from flask_restful import Resource

logger = logging.getLogger('electric.status.{0}'.format(__name__))

class StatusResource(Resource):
    def _systemctl_running(self, name):
        return os.system("systemctl is-active %s" % (name,))

    def is_dnsmasq_running(self):
        """If dnsmasq is running or not, returns true / false"""
        return self._systemctl_running("dnsmasq") == 0

    def is_docker_running(self, res):
        """Check if the docker server is running"""
        return self._systemctl_running("docker") == 0

    def check_docker_image_exists(self, res):
        """Check if the scornflake/electric-pi image has been downloaded already and what version is it?"""
        pass

    def check_docker_container_created(self, res):
        """Check if the container for the iCharger service has been created"""
        pass

    def check_docker_image_running(self, res):
        """Checks to see if the created container is actually running"""
        pass

    def get_server_status(self, res):
        """Calls into the running container to obtain the status of the iCharger service"""
        pass

    def get(self):
        # simply check for the correct configuration of required system resources and return this
        # in a dict
        res = dict()

        res["dnsmasq_running"] = self.is_dnsmasq_running()

        self.is_docker_running(res)
        self.check_docker_image_exists(res)
        self.check_docker_container_created(res)

        running = self.check_docker_image_running(res)
        if running:
            self.get_server_status(res)

        return res