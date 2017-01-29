import copy
import json
import logging

from electric.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestPresetOrdering(BasePresetTestCase):
    def setUp(self):
        super(TestPresetOrdering, self).setUp()

    def test_can_swap_two_presets(self):
        self.preset_index = self._get_preset_index()
        self.all_presets = self._get_all_presets()
        self.original_preset_index = copy.deepcopy(self.preset_index)

        try:
            # First is always at index 0. Swap the first and last.
            self.preset_index.swap(0, self.preset_index.number_of_presets - 1)

            native = self.preset_index.to_native()
            response = self.client.post("/presetorder", data=json.dumps(native), content_type='application/json')
            self.assertEqual(200, response.status_code)

            new_preset_index = self._get_preset_index()
            new_all_presets = self._get_all_presets()

            self.assertNotEqual(self.original_preset_index, new_preset_index)
            self.assertEqual(new_all_presets[0], self.all_presets[self.preset_index.number_of_presets - 1])
            self.assertEqual(new_all_presets[self.preset_index.number_of_presets - 1], self.all_presets[0])

            logger.info("Preset indexes now: {0}".format(new_preset_index))
        finally:
            # Restore the original ordering
            native = self.original_preset_index.to_native()
            response = self.client.post("/presetorder", data=json.dumps(native), content_type='application/json')
            self.assertEqual(200, response.status_code)
