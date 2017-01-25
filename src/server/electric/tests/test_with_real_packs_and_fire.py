import json
import unittest

import logging

from electric.app import application
from icharger.models import Preset

logger = logging.getLogger(__name__)


class TestWithLiveStuffs(unittest.TestCase):
    def setUp(self):
        self.client = application.test_client()
        print "Client is {0}".format(self.client)

    def test_can_write_preset(self):
        # Get preset 0
        response = self.client.get("/preset/0")
        preset = json.loads(response.data)
        print "Got preset: {0}".format(preset.to_primitive())


    def test_can_call_stop(self):
        # operation/channel_num/preset_index
        url = "/stop/0"
        response = self.client.put(url)
        d = json.loads(response.data)
        # print "Got: {0}".format(d)
        self.assertEqual(d['error'], False)

