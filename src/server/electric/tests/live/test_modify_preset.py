import json
import logging

from electric.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestPresetModification(BasePresetTestCase):
    def setUp(self):
        super(TestPresetModification, self).setUp()
        # self.reset_to_defaults()

    # def tearDown(self):
    #     self.remove_test_/preset()

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
    def test_capacity(self):
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

        self.assertEqual(test_preset.bal_over_point, 0)
        test_preset.bal_over_point = 10
        test_preset = self.save_and_reload_preset(test_preset)

        self.dump_preset(7)
        self.assertEqual(test_preset.bal_over_point, 10)

        self.assertEqual(test_preset.bal_set_point, 5)
        test_preset.bal_set_point = 10
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.bal_set_point, 10)

        self.assertEqual(test_preset.bal_delay, 1)
        test_preset.bal_delay = 4
        test_preset = self.save_and_reload_preset(test_preset)
        self.assertEqual(test_preset.bal_delay, 4)


