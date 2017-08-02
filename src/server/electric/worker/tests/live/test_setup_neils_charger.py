import json
import logging

from electric.models import SystemStorage
from electric.worker.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))

#
# You have to set this intentionally, to True, in order to run this
# It creates presets from 2->26A, in 2Amp increments
# It checks to see if they exist first.
#
PERFORM_SYSTEM_SETUP = False
PERFORM_LIPO_SETUP = True


class TestPresetCreation(BasePresetTestCase):
    def test_can_reset_system_to_neils_defaults(self):
        if PERFORM_SYSTEM_SETUP:
            neils_defaults = self.load_json_file("system/custom.json")
            self.assertIsNotNone(neils_defaults)

            response = self.client.put("/system", data=json.dumps(neils_defaults), content_type='application/json')
            self.assertEqual(response.status_code, 200)
            json_dict = json.loads(response.data)
            self.assertIsNotNone(json_dict)

            response = self.client.get("/system")
            system_object = self._turn_response_into_storage_object(response)

            self.assertEqual(system_object.charge_power[0], 570)
            self.assertEqual(system_object.charge_power[1], 570)  # 570w per channel for me

    def test_create_default_lipo_presets(self):
        if PERFORM_LIPO_SETUP:
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
        native = new_preset.to_native()
        response = self.client.put("/addpreset", data=json.dumps(native), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        return True

    def _turn_response_into_storage_object(self, response):
        json_dict = json.loads(response.data)
        self.assertEqual(json_dict['charger_presence'], "connected")
        del json_dict['charger_presence']
        return SystemStorage(json_dict)
