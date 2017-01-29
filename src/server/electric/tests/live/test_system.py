import json
import logging

from electric.app import application
from electric.icharger.models import SystemStorage
from electric.tests.live.live_testcase import LiveIChargerTestCase

logger = logging.getLogger(__name__)


class TestSystemFunctions(LiveIChargerTestCase):
    def setUp(self):
        self.client = application.test_client()

    def _turn_response_into_storage_object(self, response):
        json_dict = json.loads(response.data)
        self.assertEqual(json_dict['charger_presence'], "connected")
        del json_dict['charger_presence']
        return SystemStorage(json_dict)

    def test_get_system(self):
        response = self.client.get("/system")
        json_dict = json.loads(response.data)
        json_string = json.dumps(json_dict, indent=True, sort_keys=True)
        print "System: {0}".format(json_string)

    def test_can_change_system_params(self):
        icharger_defaults = self.load_json_file('system/defaults.json')
        response = self.client.put("/system", data=json.dumps(icharger_defaults), content_type='application/json')
        self.assertEqual(json.loads(response.data), True)

        response = self.client.get("/system")
        system_object = self._turn_response_into_storage_object(response)

        # Expecting Farenheight and 800W per side charge power
        self.assertEqual(system_object.temp_unit, "F")

        # Test against the known defaults
        self.assertEqual(system_object.temp_stop, 75)
        self.assertEqual(system_object.temp_fans_on, 40)
        self.assertEqual(system_object.temp_reduce, 10)

        self.assertEqual(system_object.fans_off_delay, 2)
        self.assertEqual(system_object.lcd_contrast, 16)
        self.assertEqual(system_object.lcd_brightness, 17)

        self.assertEqual(system_object.beep_type_key, 0)
        self.assertEqual(system_object.beep_type_hint, 0)
        self.assertEqual(system_object.beep_type_alarm, 0)
        self.assertEqual(system_object.beep_type_done, 0)

        self.assertTrue(system_object.beep_enabled_key)
        self.assertTrue(system_object.beep_enabled_hint)
        self.assertTrue(system_object.beep_enabled_alarm)
        self.assertTrue(system_object.beep_enabled_done)

        self.assertEqual(system_object.calibration, 0)
        self.assertEqual(system_object.selected_input_source, 0)

        self.assertEqual(system_object.dc_input_low_voltage, 10)
        # Spec says 505 (/10), but I get 30.5 when I reset to defaults
        self.assertEqual(system_object.dc_input_over_voltage, 30.5)
        self.assertEqual(system_object.dc_input_current_limit, 60)

        self.assertEqual(system_object.batt_input_low_voltage, 10)
        self.assertEqual(system_object.batt_input_over_voltage, 30.5)
        self.assertEqual(system_object.batt_input_current_limit, 60)

        self.assertTrue(system_object.regenerative_enable)
        self.assertEqual(system_object.regenerative_volt_limit, 14.5)
        self.assertEqual(system_object.regenerative_current_limit, 10)

        self.assertEqual(system_object.charge_power[0], 800)
        self.assertEqual(system_object.charge_power[1], 800)

        self.assertEqual(system_object.discharge_power[0], 80)
        self.assertEqual(system_object.discharge_power[1], 80)

        # 0 means average distribution
        self.assertEqual(system_object.power_priority, 0)
        self.assertEqual(system_object.power_priority_description, "average")

        self.assertEqual(system_object.monitor_log_interval[0], 10)
        self.assertEqual(system_object.monitor_log_interval[1], 10)
        self.assertTrue(system_object.monitor_save_to_sd[0])
        self.assertTrue(system_object.monitor_save_to_sd[1])

        self.assertEqual(system_object.servo_type, 0)
        self.assertEqual(system_object.servo_user_center, 15000)
        self.assertEqual(system_object.server_user_rate, 50)
        self.assertEqual(system_object.server_user_op_angle, 5000)

        self.assertEqual(system_object.modbus_mode, 0)
        self.assertEqual(system_object.modbus_serial_addr, 1)
        self.assertEqual(system_object.modbus_serial_baud_rate, 0)
        self.assertEqual(system_object.modbus_serial_parity, 0)
