import json
import logging

from electric.models import Preset
from electric.worker.tests.live.test_preset_base import BasePresetTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class TestPresetFunctions(BasePresetTestCase):
    def test_get_preset(self):
        response = self.client.get("/preset/0")
        json_dict = json.loads(response.data)
        json_string = json.dumps(json_dict, indent=True, sort_keys=True)
        print "Preset 0: {0}".format(json_string)

    def test_get_full_preset_list(self):
        response = self.client.get("/presetorder")
        print "Got {0}".format(response.data)

    def test_preset_index_object_can_count_presets(self):
        response = self.client.get("/presetorder")
        preset_index = self._turn_response_into_preset_index_object(response)
        first_empty = None
        for i, index in enumerate(preset_index.indexes):
            if index == 255:
                first_empty = i
                break
        self.assertIsNotNone(first_empty)
        self.assertEqual(first_empty, preset_index.first_empty_index_position)

        # JC/NC determine that this is kinda maybe just full'o'shit randomness - but be prepared for various
        # dragons to appear on the stage of presets
        #
        #self.assertEqual(first_empty - 1, preset_index.number_of_presets)

    def test_can_reconstruct_preset_from_json(self):
        preset_data = self.load_json_file("presets/preset-0.json")
        p = Preset(preset_data)
        self.assertEqual(p['lipo_storage_cell_voltage'], p.lipo_storage_cell_voltage)
        self.assertEqual(p['end_charge'], p.end_charge)
        self.assertEqual(p['ni_discharge_voltage'], p.ni_discharge_voltage)
        self.assertEqual(p['pb_cell'], p.pb_cell)
        self.assertEqual(p['safety_cap_c'], p.safety_cap_c)
        self.assertEqual(p['safety_cap_d'], p.safety_cap_d)
        self.assertEqual(p['lilo_storage_cell_voltage'], p.lilo_storage_cell_voltage)
        self.assertEqual(p['fast_store'], p.fast_store)
