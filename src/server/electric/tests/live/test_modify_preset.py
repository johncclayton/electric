import json
import logging

from electric.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestPresetModification(BasePresetTestCase):
    def setUp(self):
        super(TestPresetModification, self).setUp()
        self.reset_to_defaults()

    # def tearDown(self):
    #     self.remove_test_preset()

    def dump_preset(self, index):
        response = self.client.get("/preset/{0}".format(index))
        json_dict = json.loads(response.data)
        json_string = json.dumps(json_dict, indent=True, sort_keys=True)
        print "Preset {0}: {1}".format(index, json_string)

    def test_show_test_preset(self):
        self.dump_preset(7)

    def save_and_reload_preset(self, preset):
        native = preset.to_native()
        preset_endpoint = "/preset/{0}".format(preset.index)
        response = self.client.put(preset_endpoint, data=json.dumps(native), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Get it back
        response = self.client.get(preset_endpoint)
        self.assertEqual(response.status_code, 200)
        return self._turn_response_into_preset_object(response)

    # Doesn't test moving the preset within the index, just modifying in place
    def test_capacity_to_op_enable(self):
        preset_index, all_presets, test_preset = self._find_or_create_last_test_preset()

        self.assertIsNotNone(preset_index)
        self.assertIsNotNone(all_presets)
        self.assertIsNotNone(test_preset)

        # self.dump_preset(test_preset.index)

        # Name is tested as part of preset creation / lookup
        self.assertEqual(test_preset.capacity, 0)
        test_preset.capacity = 1000
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.capacity, 1000)

        self.assertEqual(test_preset.auto_save, True)
        test_preset.auto_save = False
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.auto_save, False)

        self.assertEqual(test_preset.li_balance_end_mode, 0)
        test_preset.li_balance_end_mode = 1
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.li_balance_end_mode, 1)

        # Bitmask testing is done in test_presets.py
        # But I'm not sure you can write these values. When I tried, it failed.
        # Maybe more useful on the client, to know what editors to show?
        self.assertEqual(test_preset.op_enable_mask, 255)
        self.assertEqual(test_preset.charge_enabled, False)

    def test_channel_mode_to_pb_cell(self):
        preset_index, all_presets, test_preset = self._find_or_create_last_test_preset()

        self.assertEqual(test_preset.channel_mode, 0)
        test_preset.channel_mode = 1
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.channel_mode, 1)

        # Set it back. Danger will robinson!
        test_preset.channel_mode = 0
        self.assertEqual(test_preset.save_to_sd, 1)
        test_preset.save_to_sd = 0
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.save_to_sd, 0)

        self.assertEqual(test_preset.log_interval_sec, 1)
        test_preset.log_interval_sec = 0.5
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.log_interval_sec, 0.5)

        self.assertEqual(test_preset.run_counter, 0)
        test_preset.run_counter = 100
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.run_counter, 100)

        self.assertEqual(test_preset.type, 0)
        self.assertEqual(test_preset.ni_cell, 0)
        test_preset.type = 3  # change to NiMH
        test_preset.ni_cell = 5
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.type, 3)
        self.assertEqual(test_preset.ni_cell, 5)

        # Should find that certain sections are no longer available
        # Weeeeellllll..... turns out this ISNT the case. Opmask is still 255.
        # print "Preset opmask is:{0}".format(test_preset.op_enable_mask)
        # self.assertEqual(test_preset.storage_enabled, False)
        # self.assertEqual(test_preset.balance_enabled, False)

        # Back to lipo...
        test_preset.type = 0
        test_preset = self.save_and_reload_preset(test_preset)

        self.assertEqual(test_preset.li_cell, 0)
        test_preset.li_cell = 6
        test_preset.ni_cell = 2
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.li_cell, 6)

        test_preset.li_cell = 0
        test_preset.ni_cell = 0

        # Switch to pb
        test_preset.type = 5
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.pb_cell, 6)
        test_preset.pb_cell = 2
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.pb_cell, 2)

    def reset_to_defaults(self):
        preset_index, all_presets, test_preset = self._find_or_create_last_test_preset()

        # If the test preset exists already, reset it to defaults
        # Doing this means we can comment out / remove the tearDown, and the tests are still sensible
        if test_preset:
            logger.info("Resaving preset back to defaults, as it already exists")
            replacement_test_preset = self._create_new_test_preset()
            replacement_test_preset.index = test_preset.index
            test_preset = self.save_and_reload_preset(replacement_test_preset)
        return preset_index, all_presets, test_preset

    # Doesn't test moving the preset within the index, just modifying in place
    def test_balance_variables(self):
        preset_index, all_presets, test_preset = self.reset_to_defaults()

        self.assertEqual(test_preset.bal_delay, 1)
        test_preset.bal_delay = 2
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.bal_delay, 2)

        self.assertEqual(test_preset.bal_diff, 5)
        test_preset.bal_diff = 10
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.bal_diff, 10)

        # Default is "Normal with 0.2"
        self.assertEqual(test_preset.bal_speed, 1)
        self.assertEqual(test_preset.bal_start_mode, 2)
        self.assertEqual(test_preset.bal_start_voltage, 3.0)

        # Put it into "User" mode, and revert some other settings
        test_preset.bal_speed = 3
        test_preset.bal_diff = 5
        test_preset.bal_delay = 1

        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.bal_speed, 3)
        self.assertEqual(test_preset.bal_diff, 5)
        self.assertEqual(test_preset.bal_delay, 1)

        self.assertEqual(test_preset.bal_over_point, 0)
        test_preset.bal_over_point = 10
        test_preset = self.save_and_reload_preset(test_preset)

        # This currently fails. It seems we cannot change bal_over_point?!
        # Can read it. If I change it on the charger, I can see it. Can't write it tho.
        # It always returns 0, and writes don't seem to appear on the charger.
        # self.dump_preset(7)
        # self.assertEqual(test_preset.bal_over_point, 10)

        self.assertEqual(test_preset.bal_set_point, 5)
        test_preset.bal_set_point = 10
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.bal_set_point, 10)

        self.assertEqual(test_preset.bal_delay, 1)
        test_preset.bal_delay = 4
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.bal_delay, 4)

        self.assertEqual(test_preset.keep_charge_enable, 0)
        test_preset.keep_charge_enable = 1
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.keep_charge_enable, 1)

    def test_modes(self):
        preset_index, all_presets, test_preset = self.reset_to_defaults()

        # This can be 0 or 1.
        # 0 means: "balance, of some kind"
        # 1 means: "don't balance"
        self.assertEqual(test_preset.li_mode_c, 0)
        test_preset.li_mode_c = 1
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.li_mode_c, 1)

        test_preset.li_mode_c = 0

        # li_mode_d controls two flags, "extra discharge enable" and "balance enable"
        # It's a bitmask

        self.assertFalse(test_preset.extra_discharge_enable)
        self.assertFalse(test_preset.discharge_balance_enable)

        test_preset.extra_discharge_enable = True
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.li_mode_d, 1)

        test_preset.discharge_balance_enable = True
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.li_mode_d, 3)

        # Reset the discharge flags (no real reason)
        test_preset.li_mode_d = 0

        self.assertEqual(test_preset.ni_mode_c, 0)  # Normal
        test_preset.ni_mode_c = 1
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.ni_mode_c, 1)  # Reflex

        # NiModeD intentionally skipped (reservation, in spec)

        test_preset.ni_mode_c = 0
        test_preset.type = 5  # pb
        self.assertEqual(test_preset.pb_mode_c, 0)  # Normal
        test_preset.pb_mode_c = 1
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.pb_mode_c, 1)  # Reflex

    def test_voltages(self):
        preset_index, all_presets, test_preset = self.reset_to_defaults()

        # Charging
        # 4.2 is normal for lipo
        self.assertEqual(test_preset.lipo_charge_cell_voltage, 4.2)
        # 4.1 is normal for lilo
        self.assertEqual(test_preset.lilo_charge_cell_voltage, 4.1)
        # 3.6 is normal for life
        self.assertEqual(test_preset.life_charge_cell_voltage, 3.6)

        test_preset.lipo_charge_cell_voltage = 4.0
        test_preset.lilo_charge_cell_voltage = 3.9
        test_preset.life_charge_cell_voltage = 3.5

        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.lipo_charge_cell_voltage, 4.0)
        self.assertEqual(test_preset.lilo_charge_cell_voltage, 3.9)
        self.assertEqual(test_preset.life_charge_cell_voltage, 3.5)

        # Storage
        self.assertEqual(test_preset.lipo_storage_cell_voltage, 3.85)
        self.assertEqual(test_preset.lilo_storage_cell_voltage, 3.75)
        self.assertEqual(test_preset.life_storage_cell_voltage, 3.30)

        test_preset.lipo_storage_cell_voltage = 3.82
        test_preset.lilo_storage_cell_voltage = 3.71
        test_preset.life_storage_cell_voltage = 3.25
        # test_preset.type = 1 #lilo
        # test_preset.type = 2 #life
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.lipo_storage_cell_voltage, 3.82)
        self.assertEqual(test_preset.lilo_storage_cell_voltage, 3.71)
        self.assertEqual(test_preset.life_storage_cell_voltage, 3.25)

        # Discharge
        self.assertEqual(test_preset.lipo_discharge_cell_voltage, 3.5)
        self.assertEqual(test_preset.lilo_discharge_cell_voltage, 3.5)
        self.assertEqual(test_preset.life_discharge_cell_voltage, 2.5)

        test_preset.lipo_discharge_cell_voltage = 3.4
        test_preset.lilo_discharge_cell_voltage = 3.3
        test_preset.life_discharge_cell_voltage = 2.1
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.lipo_discharge_cell_voltage, 3.4)
        self.assertEqual(test_preset.lilo_discharge_cell_voltage, 3.3)
        self.assertEqual(test_preset.life_discharge_cell_voltage, 2.1)

    def test_currents(self):
        preset_index, all_presets, test_preset = self.reset_to_defaults()

        self.assertEqual(test_preset.charge_current, 2)
        test_preset.charge_current = 5
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.charge_current, 5)

        self.assertEqual(test_preset.discharge_current, 2)
        test_preset.discharge_current = 4
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.discharge_current, 4)

        self.assertEqual(test_preset.end_charge, 10)  # %
        test_preset.end_charge = 20
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.end_charge, 20)  # %

        self.assertEqual(test_preset.end_discharge, 50)  # %
        test_preset.end_discharge = 100
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.end_discharge, 100)  # %

        # TODO: Doesn't look like regen_discharge_mode can be set
        # self.assertEqual(test_preset.regen_discharge_mode, 0)
        # test_preset.regen_discharge_mode = 1
        # test_preset = self.save_and_reload_preset(test_preset)
        # self.assertEqual(test_preset.regen_discharge_mode, 1)

        test_preset.type = 3  # ni
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.ni_peak, 3)
        test_preset.ni_peak = 13
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.ni_peak, 13)

        self.assertEqual(test_preset.ni_peak_delay, 3)
        self.assertFalse(test_preset.ni_trickle_enable)
        self.assertEqual(test_preset.ni_trickle_current, 0.05)
        self.assertEqual(test_preset.ni_trickle_time, 5)
        test_preset.ni_peak_delay = 1
        test_preset.ni_trickle_enable = True
        test_preset.ni_trickle_current = 1
        test_preset.ni_trickle_time = 10
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.ni_peak_delay, 1)
        self.assertEqual(test_preset.ni_trickle_current, 1)
        self.assertEqual(test_preset.ni_trickle_time, 10)
        self.assertTrue(test_preset.ni_trickle_enable)

        self.assertFalse(test_preset.ni_zero_enable)
        test_preset.ni_zero_enable = True
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertTrue(test_preset.ni_zero_enable)

    def test_discharge_voltages(self):
        preset_index, all_presets, test_preset = self.reset_to_defaults()
        self.assertEqual(test_preset.ni_discharge_voltage, 0.8)
        self.assertEqual(test_preset.pb_charge_voltage, 2.4)
        self.assertEqual(test_preset.pb_discharge_voltage, 1.8)

        # These are "reservation" in the spec
        # self.assertEqual(test_preset.pb_cell_float_voltage, 2.3)
        # self.assertFalse(test_preset.pb_cell_float_enable)

        test_preset.type = 5  # pb
        test_preset = self.save_and_reload_preset(test_preset)
        test_preset.ni_discharge_voltage = 10
        test_preset.pb_charge_voltage = 2.2
        test_preset.pb_discharge_voltage = 2
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.ni_discharge_voltage, 10)
        self.assertEqual(test_preset.pb_charge_voltage, 2.2)
        self.assertEqual(test_preset.pb_discharge_voltage, 2)

        # Restore
        self.assertEqual(test_preset.restore_voltage, 1)
        self.assertEqual(test_preset.restore_time, 3)
        self.assertEqual(test_preset.restore_current, 0.1)

        test_preset.restore_voltage = 2
        test_preset.restore_time = 1
        test_preset.restore_current = 0.5
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.restore_voltage, 2)
        self.assertEqual(test_preset.restore_time, 1)
        self.assertEqual(test_preset.restore_current, 0.5)

        # Cycle counts
        self.assertEqual(test_preset.cycle_count, 3)
        self.assertEqual(test_preset.cycle_delay, 0)
        self.assertEqual(test_preset.cycle_mode, 0)

        # TODO: Looks like we cannot set cycle_delay

        test_preset.cycle_count = 5
        # test_preset.cycle_delay = 15
        test_preset.cycle_mode = 3
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.cycle_count, 5)
        # self.assertEqual(test_preset.cycle_delay, 15)
        self.assertEqual(test_preset.cycle_mode, 3)

    def test_safety_and_other(self):
        preset_index, all_presets, test_preset = self.reset_to_defaults()

        self.assertEqual(test_preset.safety_time_c, 0)
        self.assertEqual(test_preset.safety_cap_c, 120)
        self.assertEqual(test_preset.safety_temp_c, 45)

        test_preset.safety_time_c = 1
        test_preset.safety_cap_c = 20
        test_preset.safety_temp_c = 30
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.safety_time_c, 1)
        self.assertEqual(test_preset.safety_cap_c, 20)
        self.assertEqual(test_preset.safety_temp_c, 30)

        # Discharge
        self.assertEqual(test_preset.safety_time_d, 0)
        self.assertEqual(test_preset.safety_cap_d, 90)
        self.assertEqual(test_preset.safety_temp_d, 45)

        test_preset.safety_time_d = 2
        test_preset.safety_cap_d = 80
        test_preset.safety_temp_d = 33
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.safety_time_d, 2)
        self.assertEqual(test_preset.safety_cap_d, 80)
        self.assertEqual(test_preset.safety_temp_d, 33)



