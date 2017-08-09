import json
import unittest

import os

HAVE_CONFIGURATION = False
try:
    with open("live.config.json") as data:
        configuration = json.load(data)

        if not configuration.get("charger"):
            raise Exception("No 'charger' key defined in config")

        HAVE_CONFIGURATION = True
except Exception, e:
    HAVE_CONFIGURATION = False


@unittest.skipUnless(HAVE_CONFIGURATION, "This test requires live.config.json to be setup. See live.config.json.example, and the 'tests/json folder'")
class LiveIChargerTestCase(unittest.TestCase):
    def _turn_response_into_object(self, response, cls, expect_charger_presence=True):
        self.assertEqual(response.status_code, 200, "Response not expected. Got: {0}".format(response))
        json_dict = json.loads(response.data)

        if expect_charger_presence:
            self.assertEqual(json_dict['charger_presence'], "connected")
            del json_dict['charger_presence']

        return cls(json_dict)

    def setup_environment_from_live_config(self):
        env = configuration.get("env") or {}
        if env:
            # Setup the new env and bounce the ZMQ connection
            os.environ.update(env)
            self.client.put("/zmq/bounce")

    @staticmethod
    def load_json_file(named):
        with open('../json/{0}/{1}'.format(configuration.get("charger"), named)) as json_file:
            return json.load(json_file)
