import unittest
from icharger.modbus_usb import iChargerUSBSerialFacade

class iChargerModUsbTestCase(unittest.TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_can_instantiate_icharger_interface_with_no_device(self):
        i = iChargerUSBSerialFacade(0x9999, 0x9999)
        self.assertIsNotNone(i)
        self.assertIsNone(i.serial_number)
        self.assertFalse(i.valid)

    def test_disconnected_charger_has_correct_presence_in_json(self):
        # TODO: validate that a crap iChargerUSBSerialFacade results in the charger being disconnected
        # for valid URIs
        pass

if __name__ == "__main__":
    unittest.main()
