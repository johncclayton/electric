import json
import logging

from electric.app import application
from icharger.models import Preset
from tests.live.live_testcase import LiveIChargerTestCase

logger = logging.getLogger(__name__)


class TestSystemFunctions(LiveIChargerTestCase):
    def setUp(self):
        self.client = application.test_client()

    def _turn_response_into_preset_object(self, response):
        json_dict = json.loads(response.data)
        self.assertEqual(json_dict['charger_presence'], "connected")
        del json_dict['charger_presence']
        return Preset(json_dict)

    def test_get_preset(self):
        response = self.client.get("/preset/0")
        json_dict = json.loads(response.data)
        json_string = json.dumps(json_dict, indent=True, sort_keys=True)
        print "Preset 0: {0}".format(json_string)

    def test_get_full_preset_list(self):
        response = self.client.get("/presetorder")
        print "Got {0}".format(response.data)

    def test_can_write_new_preset_to_last_slot(self):
        response = self.client.get("/preset/5")
        response_data = response.data
        flattened = json.loads(response_data)
        original_preset_object = Preset(flattened)
        original_preset_name = original_preset_object.name

        original_preset_object.name = "Neil Test Foo2"
        new_preset_dict = original_preset_object.to_primitive()
        response = self.client.put("/preset/5", data=json.dumps(new_preset_dict), content_type='application/json')
        print "Response: {0}".format(response)

    def test_can_reconstruct_preset_from_json(self):
        response = self.client.get("/preset/0")
        preset = json.loads(response.data)
        p = Preset.from_flat(preset)
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
