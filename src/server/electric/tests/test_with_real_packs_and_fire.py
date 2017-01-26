import json
import unittest

import logging

import struct

from electric.app import application
from icharger.models import Preset, WriteDataSegment

logger = logging.getLogger(__name__)


class TestWithLiveStuffs(unittest.TestCase):
    def setUp(self):
        self.client = application.test_client()

    def can_convert_charger_data_to_u16s(self):
        # Data is in format, "H38sLBB7cHB"
        # It should be 56 chars long
        data_from_charger = (
            0, 'NiMH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00',
            0, 1, 0, '\xff', '\xff', '\xff', '\xff', '\xff', '\xff', '\xff',
            65535, 0,)

        # Convert back to a stream of bytes, same as what the charger would have given us
        original_format = "=H38sLBB7cHB"
        expected_length_given_format = struct.calcsize(original_format)

        packed_data = struct.pack(original_format, data_from_charger)
        length_of_packed_data = len(packed_data)
        self.assertEqual(length_of_packed_data, expected_length_given_format)

        length_in_u16s = length_of_packed_data / 2
        u16_unpacking_format = "{0}H".format(length_in_u16s)
        if length_of_packed_data % 2 == 1:
            raise Exception("Cannot use data that isn't a length divisible by 2")

        # Convert to a set of U16s and check we have as many as we expect
        data_as_U16s_from_charger = struct.unpack(u16_unpacking_format, packed_data)
        self.assertEqual(len(data_as_U16s_from_charger), length_in_u16s)

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

    def test_can_reconstruct_preset_from_json(self):
        response = self.client.get("/preset/0")
        preset = json.loads(response.data)
        p = Preset.from_flat(preset)
        self.assertEqual(p['lipo_storage_cell_voltage'], p.lipo_storage_cell_voltage)
        self.assertEqual(p['end_charge'], p.end_charge)
        self.assertEqual(p['ni_discharge_voltage'], p.ni_discharge_voltage)
        self.assertEqual(p['pb_cell'], p.pb_cell)
        self.assertEqual(p['safety_cap_c'], p.safety_cap_c)
        self.assertEqual(p['safety_cap_d'], p.safety_cap_d)
        self.assertEqual(p['lilo_storage_cell_voltage'], p.lilo_storage_cell_voltage)
        self.assertEqual(p['fast_store'], p.fast_store)

    def test_can_write_new_preset_to_last_slot(self):
        response = self.client.get("/preset/0")
        response_data = response.data
        flattened = json.loads(response_data)
        original_preset_object = Preset(flattened)
        original_preset_name = original_preset_object.name

        original_preset_object.name = "Neil Test"
        new_preset_dict = original_preset_object.to_primitive()
        response = self.client.put("/preset/0", data=json.dumps(new_preset_dict), content_type='application/json');
        print "Response: {0}".format(response)

    def test_can_call_stop(self):
        # operation/channel_num/preset_index
        url = "/stop/0"
        response = self.client.put(url)
        d = json.loads(response.data)
        self.assertEqual(d['error'], False)
