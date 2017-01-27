import json
import unittest

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
    @staticmethod
    def load_json_file(named):
        with open('../json/{0}/{1}'.format(configuration.get("charger"), named)) as json_file:
            return json.load(json_file)
