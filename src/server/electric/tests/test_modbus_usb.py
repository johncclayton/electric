import unittest
import usb.core

from electric.icharger.modbus_usb import iChargerUSBSerialFacade, iChargerQuery
from modbus_tk.exceptions import ModbusInvalidRequestError

class iChargerModUsbTestCase(unittest.TestCase):
    def test_can_instantiate_icharger_interface_with_bad_vendor_and_product(self):
        with self.assertRaises(usb.core.NoBackendError) as context:
            iChargerUSBSerialFacade(0x9999, 0x9999)

    def test_disconnected_charger_has_correct_presence_in_json(self):
        # TODO: validate that a crap iChargerUSBSerialFacade results in the charger being disconnected
        # for valid URIs
        pass

    def test_query_write_fails(self):
        query = iChargerQuery()
        with self.assertRaises(ModbusInvalidRequestError) as context:
            query.build_request("a", "b")

