import unittest

from schematics.exceptions import ModelValidationError
from electric.icharger.models import DeviceInfo, DeviceInfoStatus


class TestDeviceStatusInfoSerialization(unittest.TestCase):
    def test_deviceinfostatus_keeps_modbus_value_hidden(self):
        status = DeviceInfoStatus()
        status.value = 5
        prim = status.to_primitive()
        self.assertNotIn("value", prim)
        self.assertEqual(status.run, 1)
        self.assertEqual(status.err, 0)

    def test_deviceinfostatus_json_keys(self):
        status = DeviceInfoStatus()
        json = status.to_primitive()
        self.assertIn("run", json)
        self.assertIn("err", json)
        self.assertIn("dlg_box_status", json)
        self.assertIn("cell_volt_status", json)
        self.assertIn("run_status", json)
        self.assertIn("balance", json)
        self.assertIn("ctrl_status", json)

    def test_deviceinfostatus_validation(self):
        status = DeviceInfoStatus()
        status.value = 0xff
        with self.assertRaises(ModelValidationError):
            status.validate()

        status.value = 0
        status.validate()

        status.value = 0x40
        status.validate()

        status.value = 0x7f
        status.validate()


class TestDeviceInfoSerialization(unittest.TestCase):
    def test_deviceinfo_json_keys(self):
        info = DeviceInfo()
        json = info.to_primitive()
        print(json)

