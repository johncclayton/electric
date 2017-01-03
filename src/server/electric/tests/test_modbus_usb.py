import unittest
import usb.core

from electric.icharger.modbus_usb import iChargerUSBSerialFacade, iChargerQuery, iChargerMaster
from modbus_tk.exceptions import ModbusInvalidRequestError

class iChargerModUsbTestCase(unittest.TestCase):
    # def test_raises_backend_error_with_no_libusb(self):
    #     with self.assertRaises(usb.core.NoBackendError) as context:
    #         iChargerUSBSerialFacade(0x9999, 0x9999)

    def test_bad_vendor_product_combo(self):
        charger = iChargerUSBSerialFacade(0x9999, 0x9999)
        self.assertIsNotNone(charger)

    def test_disconnected_charger_has_correct_presence_in_json(self):
        # TODO: validate that a crap iChargerUSBSerialFacade results in the charger being disconnected
        # for valid URIs
        pass

    def test_status_contains_num_channels(self):
        obj = iChargerMaster()
        status = obj.get_device_info()
        self.assertIsNotNone(status)

    def test_query_write_fails(self):
        query = iChargerQuery()
        with self.assertRaises(ModbusInvalidRequestError) as context:
            query.build_request("a", "b")

