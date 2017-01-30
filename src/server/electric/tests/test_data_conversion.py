import logging
import struct
import unittest

from electric.app import application
from electric.icharger.models import WriteDataSegment

logger = logging.getLogger(__name__)


class TestDataConversion(unittest.TestCase):
    def setUp(self):
        self.client = application.test_client()

    def test_can_convert_charger_data_to_u16s(self):
        # Data is in format, "H38sLBB7cHB"
        # It should be 56 chars long
        data_from_charger = (
            0, 'NiMH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00',
            0, 1, 0, '\xff', '\xff', '\xff', '\xff', '\xff', '\xff', '\xff',
            65535, 0,)

        # Convert back to a stream of bytes, same as what the charger would have given us
        original_format = "=H38sLBB7cHB"
        expected_length_given_format = struct.calcsize(original_format)

        packed_data = struct.pack(original_format, *data_from_charger)
        length_of_packed_data = len(packed_data)
        self.assertEqual(length_of_packed_data, expected_length_given_format)

        length_in_u16s = length_of_packed_data / 2
        u16_unpacking_format = "{0}H".format(length_in_u16s)
        if length_of_packed_data % 2 == 1:
            raise Exception("Cannot use data that isn't a length divisible by 2")

        # Convert to a set of U16s and check we have as many as we expect
        data_as_U16s_from_charger = struct.unpack(u16_unpacking_format, packed_data)
        self.assertEqual(len(data_as_U16s_from_charger), length_in_u16s)

    def test_setting_set2_of_preset(self):
        data = (True, 10, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 3, 2, 3000, 5, 10, 5)
        u16s = WriteDataSegment.convert_tuples_to_u16s(data, "BHH12BHBBB")

        data_bytes = struct.pack("=BHH12BHBBB", *data)
        u16_bytes = struct.pack("{0}H".format(len(u16s)), *u16s)
        self.assertEqual(data_bytes, u16_bytes)

    def test_can_convert_into_U16s(self):
        fake_data = (1,
                     "Crappy Code",
                     10,
                     1,
                     0,
                     chr(0xff), chr(0xff), chr(0xff), chr(0xff), chr(0xff), chr(0xff), chr(0xff),  # 7 reserved bytes
                     65535,
                     5,)

        # This is the format used in a Preset. It's the byte stream that we need to send.
        original_format = "H38sLBB7cHB"
        native_format = "=" + original_format
        expected_length_given_format = struct.calcsize(native_format)

        # Lets pack it directly, and check we get the right number of bytes
        packed_data = struct.pack(native_format, *fake_data)
        length_of_packed_data = len(packed_data)
        self.assertEqual(length_of_packed_data, expected_length_given_format)

        # Convert to a set of U16s
        length_in_u16s = length_of_packed_data / 2
        u16_unpacking_format = "{0}H".format(length_in_u16s)
        if length_of_packed_data % 2 == 1:
            raise Exception("Cannot use data that isn't a length divisible by 2")
        data_as_U16s_from_charger = struct.unpack(u16_unpacking_format, packed_data)

        # The tuples returned by to_modbus_data are expected to be a set of U16s.
        # If we re-pack this as data, we should get the same string/bytes
        repacked = struct.pack(u16_unpacking_format, *data_as_U16s_from_charger)
        self.assertEqual(repacked, packed_data)

        # Do the same using the WriteDataSegment packing method. It should match.
        converted_tuples = WriteDataSegment.convert_tuples_to_u16s(fake_data, original_format)
        self.assertEqual(data_as_U16s_from_charger, converted_tuples)
