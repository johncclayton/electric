import json
import logging
import time

from electric.worker.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestCharging(BasePresetTestCase):
    CHARGE_PRESET_NAME = "CHAARGE"

    def setUp(self):
        super(TestCharging, self).setUp()
        self.clear_existing_charge_preset()

    def clear_existing_charge_preset(self):
        preset = self._find_preset_with_name(TestCharging.CHARGE_PRESET_NAME)
        while preset is not None:
            logger.info("Deleting slot {0}".format(preset.memory_slot))
            response = self.client.delete("/preset/{0}".format(preset.memory_slot))
            self.assertEqual(response.status_code, 200)
            preset = self._find_preset_with_name(TestCharging.CHARGE_PRESET_NAME)

    def test_can_charge_using_test_preset(self):
        if True:
            preset = self._find_preset_with_name(TestCharging.CHARGE_PRESET_NAME)
            if preset is None:
                preset = self._create_new_test_preset(TestCharging.CHARGE_PRESET_NAME)
                # First, we set it to small amperage, in case we're running off a batt pack.
                preset.charge_current = 0.5
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

            json_dict = json.loads(response.data)
            print json.dumps(json_dict, indent=3)

            # Wait for the charge to begin...
            wait_time = 0
            time.sleep(5)
            channel_status = self._get_channel(0)
            while channel_status.curr_out_amps < 0.3 and wait_time < 30:
                logger.info("Channel 0 charging at {0}A...".format(channel_status.curr_out_amps))
                time.sleep(2)
                # self.assertEqual(false, )
                channel_status = self._get_channel(0)
                wait_time += 2

            self.assertTrue(wait_time < 30, "timeout waiting for charge / amps!")

            logger.info("Channel 0 charging at {0}A... Changing to 0.8A".format(channel_status.curr_out_amps))

            # Write <different>A to the preset. And see if the charger changes.
            preset.charge_current = 0.8
            preset = self.save_and_reload_preset(preset)
            self.assertEqual(preset.charge_current, 0.8)

            # Wait 2s. Then stop
            response = self.client.put("/stop/0")
            self.assertEqual(response.status_code, 200)

