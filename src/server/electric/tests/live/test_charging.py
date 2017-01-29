import logging

from electric.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestCharging(BasePresetTestCase):
    def tearDown(self):
        self.remove_test_preset()

    def test_can_charge_using_test_preset(self):
        if True:
            preset_index, all_presets, test_preset = self._find_or_create_last_test_preset()

            # We use a test preset.
            # First, we set it to 1A.
            test_preset.charge_current = 1.0
            test_preset = self.save_and_reload_preset(test_preset)

            endpoint = "/charge/0/{0}".format(test_preset.memory_slot)
            logger.info("Test preset at memory slot {0}. Calling: {1}".format(test_preset.memory_slot, endpoint))

            # Now kick off a charge
            response = self.client.put(endpoint)
            self.assertEqual(response.status_code, 200)

            # Wait 2s. Then stop


