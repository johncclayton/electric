import logging
import unittest

from schematics.exceptions import ModelValidationError
from electric.models import DeviceInfo, DeviceInfoStatus, PresetIndex, Preset
from electric.worker.cache import reset_caches, get_device_info_cached, get_channel_status_cached, set_channel_status, set_device_info_cached

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestDeviceStatusInfoSerialization(unittest.TestCase):
    def test_deviceinfostatus_keeps_modbus_value_hidden(self):
        status = DeviceInfoStatus()
        status.value = 5
        prim = status.to_primitive()
        self.assertNotIn("value", prim)
        self.assertEqual(status.run, 1)
        self.assertEqual(status.err, 0)

    def test_can_fetch_device_info_when_its_not_been_set(self):
        reset_caches()
        self.assertIsNone(get_device_info_cached())
        self.assertIsNone(get_channel_status_cached(0))
        self.assertIsNone(get_channel_status_cached(1))

        score = { "them": 1, "me": None }
        set_device_info_cached(score)

        self.assertEqual(get_device_info_cached(), score)

        set_channel_status(0, score)
        self.assertEqual(get_channel_status_cached(0), score)
        self.assertIsNone(get_channel_status_cached(1))

        set_channel_status(0, None)
        set_channel_status(1, score)
        self.assertEqual(get_channel_status_cached(1), score)
        self.assertIsNone(get_channel_status_cached(0))

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

    def test_preset_index_with_all_presets_filled(self):
        p = PresetIndex()
        p.count = 64
        p.indexes = [num for num in range(0, 64)]

        # Should have 64 presets
        self.assertEqual(64, p.number_of_presets)

        # And no free slots
        self.assertIsNone(p.first_empty_index_position)

    def test_preset_op_enable_mask(self):
        p = Preset()
        p.op_enable_mask = 255
        self.assertTrue(p.charge_enabled)
        self.assertTrue(p.storage_enabled)
        self.assertTrue(p.discharge_enabled)
        self.assertTrue(p.cycle_enabled)
        self.assertTrue(p.balance_enabled)

        p.charge_enabled = False
        self.assertEquals(p.op_enable_mask, 254)

        p.discharge_enabled = False
        self.assertEquals(p.op_enable_mask, 246)

        p.storage_enabled = False
        self.assertEquals(p.op_enable_mask, 242)

        p.cycle_enabled = False
        self.assertEquals(p.op_enable_mask, 226)

        p.balance_enabled = False
        self.assertEquals(p.op_enable_mask, 194)

    def test_preset_indexes_are_swapped_ok(self):
        p = PresetIndex()
        p.count = 4
        p.indexes = [0, 1, 2, 3, 255]
        p.swap(0, 3)
        self.assertEqual([3, 1, 2, 0, 255], p.indexes)

    def test_preset_index_filling_gives_us_64_items(self):
        p = PresetIndex()
        p.set_indexes([0, 255])
        self.assertEqual(1, p.number_of_presets)
        self.assertEqual(64, len(p.indexes))

    def test_deleting_shuffles_indexes_left(self):
        p = PresetIndex()
        p.set_indexes([0, 1, 2, 3, 255])
        self.assertEqual(4, p.number_of_presets)

        expected_index_list = list(p.indexes)
        del expected_index_list[0]
        expected_index_list.append(255)

        # logger.info("Is now: {0}".format(p.indexes))
        p.delete_item_at_index(0)
        self.assertEqual(expected_index_list, p.indexes)
        self.assertEqual(3, p.number_of_presets)

    def test_throws_exception_if_index_out_of_range(self):
        p = PresetIndex()
        p.count = 4
        p.set_indexes([0, 1, 2, 3, 255])
        self.assertEqual(p.number_of_presets, 4)
        self.assertFalse(p.is_valid_index(4))
        self.assertFalse(p.is_valid_index(-1))
        self.assertTrue(p.is_valid_index(0))
        self.assertTrue(p.is_valid_index(1))
        self.assertTrue(p.is_valid_index(3))

    def test_adding_preset_modifies_both_index_and_preset(self):
        p = Preset()
        p.index = 123

        pi = PresetIndex()
        pi.set_indexes([0, 1, 2, 3, 255])

        pi.add_to_index(p)
        self.assertEqual(p.memory_slot, 4)
        self.assertEqual(pi.index_of_preset_with_memory_slot_number(4), 4)
        print "PI: {0}".format(pi.indexes)

    def test_preset_index_can_provide_next_available_slot(self):
        p = PresetIndex()
        p.set_indexes([0, 1, 2, 3, 255])
        self.assertEqual(4, p.next_available_memory_slot)

        p.set_indexes([0, 2, 8, 10, 255])
        self.assertEqual(1, p.next_available_memory_slot)

        p.set_indexes([1, 2, 8, 10, 255])
        self.assertEqual(0, p.next_available_memory_slot)

        p.set_indexes([1, 0, 2, 8, 10, 255])
        self.assertEqual(3, p.next_available_memory_slot)

        # Fill it up entirely
        p.set_indexes(list(range(0, 64)))
        self.assertIsNone(p.next_available_memory_slot)


class TestDeviceInfoSerialization(unittest.TestCase):
    def test_deviceinfo_json_keys(self):
        info = DeviceInfo()
        json = info.to_primitive()
        print(json)
