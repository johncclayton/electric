import json
import logging

import collections

from electric.app import application
from icharger.models import Preset, PresetIndex
from tests.live.live_testcase import LiveIChargerTestCase

logger = logging.getLogger("electric.app.test.{0}".format(__name__))


class BasePresetTestCase(LiveIChargerTestCase):
    def setUp(self):
        self.client = application.test_client()

    def _turn_response_into_preset_object(self, response):
        return self._turn_response_into_object(response, Preset, False)

    def _turn_response_into_preset_index_object(self, response):
        return self._turn_response_into_object(response, PresetIndex, False)

    def _turn_response_into_preset_list(self, response):
        json_dict = json.loads(response.data)
        if type(json_dict) is not list:
            message = "{0} isn't a list!".format(json_dict)
            raise Exception(message)

        list_of_presets = []
        for item in json_dict:
            list_of_presets.append(Preset(item))
        return list_of_presets

    def _find_last_test_preset(self):
        response = self.client.get("/preset")
        all_presets = self._turn_response_into_preset_list(response)
        self.assertIsNotNone(all_presets)

        preset_index = self._turn_response_into_preset_index_object(self.client.get("/presetorder"))
        self.assertIsNotNone(preset_index)

        test_preset = None
        for index in preset_index.range_of_presets():
            preset = all_presets[index]
            if preset.name == "Test Preset":
                test_preset = preset
        return preset_index, all_presets, test_preset


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
        self.assertEqual(first_empty, preset_index.first_empty_slot)
        self.assertEqual(first_empty - 1, preset_index.number_of_presets)

    # def test_can_write_new_preset_to_last_slot(self):
    #     response = self.client.get("/preset/5")
    #     response_data = response.data
    #     flattened = json.loads(response_data)
    #     original_preset_object = Preset(flattened)
    #     original_preset_name = original_preset_object.name
    #
    #     original_preset_object.name = "Neil Test Foo2"
    #     new_preset_dict = original_preset_object.to_primitive()
    #     response = self.client.put("/preset/5", data=json.dumps(new_preset_dict), content_type='application/json')
    #     print "Response: {0}".format(response)

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

    def test_can_call_stop(self):
        # operation/channel_num/preset_index
        url = "/stop/0"
        response = self.client.put(url)
        d = json.loads(response.data)
        self.assertEqual(d['error'], False)
