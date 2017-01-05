from electric.app import AppInterface
from electric.icharger.modbus_usb import testing_control
import unittest, json

class TestRestfulAPI(unittest.TestCase):
    def setUp(self):
        self.app = AppInterface()
        self.client = self.app.app.test_client()
        testing_control.reset()

    def test_can_get_with_no_icharger_attached(self):
        testing_control.usb_device_present = False

        resp = self.client.get("/status")
        d = json.loads(resp.data)
        self.assertIn("exception", d.keys())
        self.assertIn("charger_presence", d.keys())
        self.assertEqual("disconnected", d["charger_presence"])

    def test_can_request_storage_area(self):
        testing_control.reset()

        resp = self.client.get("/system")
        d = json.loads(resp.data)
        self.assertIsNotNone(d)
        self.assertIsNotNone(d.keys())
        self.assertIn("light_value", d.keys())
        self.assertIn("temp_unit", d.keys())

    def test_uris_contain_charger_presence(self):
        resp = self.client.get("/status")
        d = json.loads(resp.data)
        self.assertEqual("connected", d["charger_presence"])

        resp = self.client.get("/control")
        d = json.loads(resp.data)
        self.assertEqual("connected", d["charger_presence"])

        resp = self.client.get("/system")
        d = json.loads(resp.data)
        self.assertEqual("connected", d["charger_presence"])

        resp = self.client.get("/channel/1")
        d = json.loads(resp.data)
        self.assertEqual("connected", d["charger_presence"])

        resp = self.client.get("/channel/2")
        d = json.loads(resp.data)
        self.assertEqual("connected", d["charger_presence"])
