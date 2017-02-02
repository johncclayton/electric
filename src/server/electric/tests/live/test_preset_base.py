import json
import logging

from electric.app import application
from electric.icharger.models import Preset, PresetIndex, ChannelStatus
from electric.tests.live.live_testcase import LiveIChargerTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class BasePresetTestCase(LiveIChargerTestCase):
    def setUp(self):
        super(LiveIChargerTestCase, self).setUp()
        self.client = application.test_client()

    def _turn_response_into_preset_object(self, response):
        return self._turn_response_into_object(response, Preset, False)

    def _turn_response_into_preset_index_object(self, response):
        return self._turn_response_into_object(response, PresetIndex, False)

    def _turn_response_into_channel_status(self, response):
        return self._turn_response_into_object(response, ChannelStatus, True)

    def _turn_response_into_preset_list(self, response):
        json_dict = json.loads(response.data)
        if type(json_dict) is not list:
            message = "{0} isn't a list!".format(json_dict)
            raise Exception(message)

        list_of_presets = []
        for item in json_dict:
            list_of_presets.append(Preset(item))
        return list_of_presets

    def _create_new_test_preset(self, name="Test Preset"):
        test_preset_dict = self.load_json_file("presets/preset-0.json")
        self.assertIsNotNone(test_preset_dict)
        test_preset = Preset(test_preset_dict)
        test_preset.auto_save = False
        test_preset.name = name
        return test_preset

    def _find_preset_with_name(self, name):
        logger.info("Looking for preset with name: {0}".format(name))
        all_presets = self._get_all_presets()
        for preset in all_presets:
            if preset.name == name:
                return preset
        return None

    def _find_or_create_last_test_preset(self):
        preset_index, all_presets, test_preset = self._find_last_test_preset()
        if test_preset:
            return preset_index, all_presets, test_preset

        logger.info("No test preset exists. Will create at {0}".format(preset_index.first_empty_index_position))

        test_preset = self._create_new_test_preset()
        native = test_preset.to_native()
        response = self.client.put("/addpreset", data=json.dumps(native), content_type='application/json')
        self.assertEqual(response.status_code, 200, "Failed with {0}".format(response))

        # Read the preset list back in, and check that we have one more item
        new_preset_index = self._turn_response_into_preset_index_object(self.client.get("/presetorder"))
        self.assertEqual(new_preset_index.number_of_presets, preset_index.number_of_presets + 1)
        self.assertEqual(new_preset_index.first_empty_index_position, preset_index.first_empty_index_position + 1)

        # The other presets should be identical to before.
        new_presets = self._turn_response_into_preset_list(self.client.get("/preset"))
        for index, old_preset in enumerate(all_presets):
            new_preset = new_presets[index]
            self.assertEqual(new_preset, old_preset)

        # Force a relookup, so we get the latest index and all presets
        return self._find_last_test_preset()

    def remove_test_preset(self):
        preset_index, all_presets, test_preset = self._find_last_test_preset()

        if test_preset:
            print "Index: {0}".format(preset_index.to_native())
            print "Test preset is in memory slot {0}".format(test_preset.memory_slot)

            response = self.client.delete("/preset/{0}".format(test_preset.memory_slot))
            self.assertEqual(response.status_code, 200)

            # Check it is gone
            new_preset_index, new_presets, new_test_preset = self._find_last_test_preset()
            self.assertEqual(new_preset_index.number_of_presets, preset_index.number_of_presets - 1)

            # Because we are deleting, the first empty index position should also decrease
            self.assertEqual(new_preset_index.first_empty_index_position, preset_index.first_empty_index_position - 1)

            # And we should not be able to get the old preset, by memory_slot, anymore
            response = self.client.get("/preset/{0}".format(test_preset.memory_slot))
            if response.status_code != 404:
                json_dict = json.loads(response.data)
                print "Unexpected: got back a preset: {0}".format(json.dumps(json_dict, sort_keys=True, indent=True))
            self.assertEqual(response.status_code, 404)

    def _get_preset_index(self):
        response = self.client.get("/presetorder")
        preset_index_object = self._turn_response_into_preset_index_object(response)
        return preset_index_object

    def _get_all_presets(self):
        response = self.client.get("/preset")
        return self._turn_response_into_preset_list(response)

    def _get_channel(self, channel):
        response = self.client.get("/channel/{0}".format(channel))
        return self._turn_response_into_channel_status(response)

    def _find_last_test_preset(self):
        all_presets = self._get_all_presets()
        self.assertIsNotNone(all_presets)

        preset_index = self._get_preset_index()
        self.assertIsNotNone(preset_index)

        test_preset = None
        for index in preset_index.range_of_presets():
            preset = all_presets[index]
            if preset.is_unused:
                continue
            if preset.name == "Test Preset":
                test_preset = preset
        return preset_index, all_presets, test_preset

    def reset_to_defaults(self):
        preset_index, all_presets, test_preset = self._find_or_create_last_test_preset()

        # If the test preset exists already, reset it to defaults
        # Doing this means we can comment out / remove the tearDown, and the tests are still sensible
        if test_preset:
            logger.info("Resaving preset back to defaults, as it already exists")
            replacement_test_preset = self._create_new_test_preset()
            replacement_test_preset.memory_slot = test_preset.memory_slot
            test_preset = self.save_and_reload_preset(replacement_test_preset)
        return preset_index, all_presets, test_preset

    def save_and_reload_preset(self, preset):
        native = preset.to_native()
        preset_endpoint = "/preset/{0}".format(preset.memory_slot)
        response = self.client.put(preset_endpoint, data=json.dumps(native), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # Get it back
        response = self.client.get(preset_endpoint)
        self.assertEqual(response.status_code, 200)
        return self._turn_response_into_preset_object(response)

