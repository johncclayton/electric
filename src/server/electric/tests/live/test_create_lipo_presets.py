import json
import logging

from electric.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))

#
# You have to set this intentionally, to True, in order to run this
# It creates presets from 2->26A, in 2Amp increments
# It checks to see if they exist first.
#
RUN_THIS_TEST = False


class TestPresetCreation(BasePresetTestCase):
    def test_create_default_lipo_presets(self):
        if RUN_THIS_TEST:
            for amps in range(2, 26, 2):
                name = "Lipo {0}A".format(amps)
                lipo_preset = self._find_preset_with_name(name)
                if not lipo_preset:
                    self.assertTrue(self.append_new_preset(name, amps))

    def append_new_preset(self, name, charge_current):
        logger.info("Creating new preset from default, lipo, for {0} amps".format(charge_current))
        new_preset = self._create_new_test_preset()
        new_preset.name = name
        new_preset.charge_current = charge_current

        # Where to put it?
        preset_index = self._turn_response_into_preset_index_object(self.client.get("/presetorder"))
        next_available_slot = preset_index.first_empty_index_position
        if next_available_slot:
            preset_endpoint = "preset/{0}".format(next_available_slot)
            native = new_preset.to_native()
            response = self.client.put(preset_endpoint, data=json.dumps(native), content_type='application/json')
            self.assertEqual(response.status_code, 200)
            return True
        return False
