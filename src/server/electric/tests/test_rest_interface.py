from electric.app import AppInterface
import unittest, json

class TestRestfulAPI(unittest.TestCase):
    def setUp(self):
        self.app = AppInterface()
        self.client = self.app.app.test_client()

    def tearDown(self):
        pass

    def test_can_get_with_no_icharger_attached(self):
        resp = self.client.get("/status")
        d = json.loads(resp.data)
        self.assertIn("exception", d.keys())
        self.assertIn("charger_presence", d.keys())
        self.assertEqual("disconnected", d["charger_presence"])