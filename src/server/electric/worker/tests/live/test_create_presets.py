import logging

from electric.worker.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestPresetCreation(BasePresetTestCase):
    def tearDown(self):
        self.remove_test_preset()

        preset_index = self._get_preset_index()
        print "Preset index, after delete: {0}".format(preset_index)

    def test_create_and_remove_test_preset(self):
        preset_index, all_presets, test_preset = self._find_or_create_last_test_preset()

        self.assertIsNotNone(preset_index)
        self.assertIsNotNone(all_presets)
        self.assertIsNotNone(test_preset)

        # Figure I'm not going to have more than that?
        self.assertLess(preset_index.number_of_presets, 30)



