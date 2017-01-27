import json
import logging

from icharger.models import Preset
from tests.live.test_presets import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestPresetCreation(BasePresetTestCase):
    def tearDown(self):
        self.remove_test_preset()

    def remove_test_preset(self):
        preset_index, all_presets, test_preset = self._find_last_test_preset()

        if test_preset:
            print "Index: {0}".format(preset_index.to_native())
            print "Test preset has display index {1}: {0}".format(test_preset.to_native(), test_preset.index)

            response = self.client.delete("/preset/{0}".format(test_preset.index))
            self.assertEqual(response.status_code, 200)
            print "Delete response: {0}".format(response.data)

            # Check it is gone
            new_preset_index, new_presets, new_test_preset = self._find_last_test_preset()
            self.assertEqual(new_preset_index.number_of_presets, preset_index.number_of_presets - 1)

            # Because we are deleting the last one, the first empty slot should also decrease
            self.assertEqual(new_preset_index.first_empty_slot, preset_index.first_empty_slot - 1)

            # And we should not be able to get the old preset, by index, anymore
            response = self.client.get("/preset/{0}".format(test_preset.index))
            self.assertEqual(response.status_code, 404)

    def test_create_and_remove_test_preset(self):
        preset_index, all_presets, test_preset = self._find_last_test_preset()

        # Figure I'm not going to have more than that?
        self.assertLess(preset_index.number_of_presets, 30)

        if not test_preset:
            logger.info("No test preset exists. Will create at {0}".format(preset_index.first_empty_slot))

            test_preset_dict = self.load_json_file("presets/preset-0.json")
            self.assertIsNotNone(test_preset_dict)
            test_preset = Preset(test_preset_dict)
            test_preset.name = "Test Preset"

            native = test_preset.to_native()
            preset_endpoint = "/preset/{0}".format(preset_index.first_empty_slot)
            response = self.client.put(preset_endpoint, data=json.dumps(native), content_type='application/json')

            # TODO: error handling

            # Read the preset list back in, and check that we have one more item
            new_preset_index = self._turn_response_into_preset_index_object(self.client.get("/presetorder"))
            self.assertEqual(new_preset_index.number_of_presets, preset_index.number_of_presets + 1)
            self.assertEqual(new_preset_index.first_empty_slot, preset_index.first_empty_slot + 1)

            # The other presets should be identical to before.
            new_presets = self._turn_response_into_preset_list(self.client.get("/preset"))
            for index, old_preset in enumerate(all_presets):
                new_preset = new_presets[index]
                self.assertEqual(new_preset, old_preset)

