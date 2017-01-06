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

    def test_can_request_status(self):
        resp = self.client.get("/status")
        d = json.loads(resp.data)

        self.assertEqual("connected", d["charger_presence"])
        self.assertEqual(d["channel_count"], 2)
        self.assertTrue(len(d["device_sn"]) > 5)
        self.assertTrue(d["memory_len"] > 0)
        self.assertTrue(d["system_len"] > 0)
        self.assertTrue(d["device_id"] > 0)

        s1 = d["ch1_status"]
        self.assertTrue(s1["run"] >= 0)
        self.assertTrue(s1["err"] >= 0)
        self.assertTrue(s1["run_status"] >= 0)
        self.assertTrue(s1["dlg_box_status"] >= 0)
        self.assertTrue(s1["cell_volt_status"] >= 0)
        self.assertTrue(s1["ctrl_status"] >= 0)
        self.assertTrue(s1["balance"] >= 0)

        s2 = d["ch2_status"]
        self.assertTrue(s2["run"] >= 0)
        self.assertTrue(s2["err"] >= 0)
        self.assertTrue(s2["run_status"] >= 0)
        self.assertTrue(s2["dlg_box_status"] >= 0)
        self.assertTrue(s2["cell_volt_status"] >= 0)
        self.assertTrue(s2["ctrl_status"] >= 0)
        self.assertTrue(s2["balance"] >= 0)

    def test_can_request_storage_area(self):
        testing_control.reset()

        resp = self.client.get("/system")
        d = json.loads(resp.data)
        self.assertIsNotNone(d)
        self.assertIsNotNone(d.keys())
        self.assertIn("light_value", d.keys())
        self.assertIn("temp_unit", d.keys())
        self.assertEqual("connected", d["charger_presence"])

    def test_can_request_control(self):
        testing_control.reset()
        resp = self.client.get("/control")
        d = json.loads(resp.data)

        self.assertIsNotNone(d)
        self.assertIsNotNone(d.keys())
        self.assertTrue(d["limit_volt"] >= 0)
        self.assertTrue(d["limit_current"] >= 0)
        self.assertTrue(d["op"] >= 0)

        self.assertTrue(d["memory"] >= 0)
        self.assertTrue(d["order_lock"] >= 0)
        self.assertTrue(d["order"] >= 0)

        self.assertIn("op_description", d)
        self.assertIn("order_description", d)

        # and this is NOT one of the keys...
        self.assertNotIn("charger_presence", d)

    def test_can_request_channel(self):
        resp = self.client.get("/channel/0")
        d = json.loads(resp.data)
        print(d)
        self.assertEqual("connected", d["charger_presence"])
        self.assertEqual(d["channel"], 0)

        # validate presence of specific keys in the output - this ensures any protocol changes will break unit tests
        self.assertTrue(d["timestamp"] >= 0)
        self.assertTrue(d["curr_out_power"] >= 0)
        self.assertTrue(d["curr_out_amps"] >= 0)
        self.assertTrue(d["curr_inp_volts"] >= 0)
        self.assertTrue(d["curr_out_volts"] >= 0)
        self.assertTrue(d["curr_out_capacity"] >= 0)
        self.assertTrue(d["curr_int_temp"] >= 0)
        self.assertTrue(d["curr_ext_temp"] >= 0)
        self.assertTrue(d["cell_total_ir"] >= 0)
        self.assertTrue(d["line_intern_resistance"] >= 0)
        self.assertTrue(d["cycle_count"] >= 0)
        self.assertTrue(d["control_status"] >= 0)
        self.assertTrue(d["run_status"] >= 0)
        self.assertTrue(d["run_error"] >= 0)
        self.assertTrue(d["dlg_box_id"] >= 0)

        for x in range(0, 9):
            self.assertEqual(d["cells"][x]["cell"], x)
            self.assertTrue(d["cells"][x]["v"] >= 0)
            self.assertTrue(d["cells"][x]["balance"] >= 0)
            self.assertTrue(d["cells"][x]["ir"] >= 0)

        resp = self.client.get("/channel/1")
        d = json.loads(resp.data)
        self.assertEqual("connected", d["charger_presence"])
        self.assertEqual(d["channel"], 1)

        resp = self.client.get("/channel/2")
        d = json.loads(resp.data)
        self.assertEqual("disconnected", d["charger_presence"])
        self.assertIn("exception", d)
        self.assertEqual(d["exception"], "Channel part of URI must be 0 or 1")
