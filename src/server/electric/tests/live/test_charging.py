import json
import logging

import time

from electric.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestCharging(BasePresetTestCase):
    def setUp(self):
        super(TestCharging, self).setUp()

    # This was here to let me clean up the CHAARGE preset when things were going "badly"
    def clear_existing_charge_prest(self):
        preset = self._find_preset_with_name("CHAARGE")
        while preset is not None:
            logger.info("Deleting slot {0}".format(preset.memory_slot))
            response = self.client.delete("/preset/{0}".format(preset.memory_slot))
            self.assertEqual(response.status_code, 200)
            preset = self._find_preset_with_name("CHAARGE")


    def test_can_charge_using_test_preset(self):
        if True:
            preset = self._find_preset_with_name("CHAARGE")
            if preset is None:
                preset = self._create_new_test_preset("CHAARGE")
                # First, we set it to 1A.
                preset.charge_current = 1.0
                preset.auto_save = False
                native = preset.to_native()
                response = self.client.put("/addpreset", data=json.dumps(native), content_type='application/json')
                preset = self._turn_response_into_preset_object(response)

            logger.info("Preset: {0}".format(preset.to_primitive()))
            logger.info("Index: {0}".format(self._get_preset_index().to_primitive()))

            endpoint = "/charge/0/{0}".format(preset.memory_slot)
            logger.info("Test preset at memory slot {0}. Calling: {1}".format(preset.memory_slot, endpoint))

            # Now kick off a charge
            response = self.client.put(endpoint)
            self.assertEqual(response.status_code, 200)

            # Wait 2s. Then stop
            time.sleep(15)
            response = self.client.put("/stop/0")
            self.assertEqual(response.status_code, 200)
