import json
import logging

from electric.app import application
from electric.models import SystemStorage
from electric.worker.tests.live.live_testcase import LiveIChargerTestCase

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
        self.assertEqual(system_object.temp_unit, icharger_defaults["temp_unit"])

        # Test against the known defaults
        self.assertEqual(system_object.temp_stop, icharger_defaults["temp_stop"])
        self.assertEqual(system_object.temp_fans_on, icharger_defaults["temp_fans_on"])
        self.assertEqual(system_object.temp_reduce, icharger_defaults["temp_reduce"])

        self.assertEqual(system_object.fans_off_delay, icharger_defaults["fans_off_delay"])
        self.assertEqual(system_object.lcd_contrast, icharger_defaults["lcd_contrast"])
        self.assertEqual(system_object.lcd_brightness, icharger_defaults["lcd_brightness"])

        self.assertEqual(system_object.beep_type_key, icharger_defaults["beep_type_key"])
        self.assertEqual(system_object.beep_type_hint, icharger_defaults["beep_type_hint"])
        self.assertEqual(system_object.beep_type_alarm, icharger_defaults["beep_type_alarm"])
        self.assertEqual(system_object.beep_type_done, icharger_defaults["beep_type_done"])

        self.assertEqual(system_object.beep_enabled_key, icharger_defaults["beep_enabled_key"])
        self.assertEqual(system_object.beep_enabled_hint, icharger_defaults["beep_enabled_hint"])
        self.assertEqual(system_object.beep_enabled_alarm, icharger_defaults["beep_enabled_alarm"])
        self.assertEqual(system_object.beep_enabled_done, icharger_defaults["beep_enabled_done"])

        self.assertEqual(system_object.calibration, icharger_defaults["calibration"])
        self.assertEqual(system_object.selected_input_source, icharger_defaults["selected_input_source"])

        self.assertEqual(system_object.dc_input_low_voltage, icharger_defaults["dc_input_low_voltage"])
        # Spec says 505 (/10), but I get 30.5 when I reset to defaults
        self.assertEqual(system_object.dc_input_over_voltage, icharger_defaults["dc_input_over_voltage"])
        self.assertEqual(system_object.dc_input_current_limit, icharger_defaults["dc_input_current_limit"])

        self.assertEqual(system_object.batt_input_low_voltage, icharger_defaults["batt_input_low_voltage"])
        self.assertEqual(system_object.batt_input_over_voltage, icharger_defaults["batt_input_over_voltage"])
        self.assertEqual(system_object.batt_input_current_limit, icharger_defaults["batt_input_current_limit"])

        self.assertEqual(system_object.regenerative_enable, icharger_defaults["regenerative_enable"])
        self.assertEqual(system_object.regenerative_volt_limit, icharger_defaults["regenerative_volt_limit"])
        self.assertEqual(system_object.regenerative_current_limit, icharger_defaults["regenerative_current_limit"])

        self.assertEqual(system_object.charge_power[0], icharger_defaults["charge_power"][0])
        self.assertEqual(system_object.charge_power[1], icharger_defaults["charge_power"][1])

        self.assertEqual(system_object.discharge_power[0], icharger_defaults["discharge_power"][0])
        self.assertEqual(system_object.discharge_power[1], icharger_defaults["discharge_power"][1])

        # 0 means average distribution
        self.assertEqual(system_object.power_priority, icharger_defaults["power_priority"])
        self.assertEqual(system_object.power_priority_description, icharger_defaults["power_priority_description"])

        self.assertEqual(system_object.monitor_log_interval[0], icharger_defaults["monitor_log_interval"][0])
        self.assertEqual(system_object.monitor_log_interval[1], icharger_defaults["monitor_log_interval"][1])
        self.assertTrue(system_object.monitor_save_to_sd[0],  icharger_defaults["monitor_save_to_sd"][0])
        self.assertTrue(system_object.monitor_save_to_sd[1],  icharger_defaults["monitor_save_to_sd"][1])

        self.assertEqual(system_object.servo_type, icharger_defaults["servo_type"])
        self.assertEqual(system_object.servo_user_center, icharger_defaults["servo_user_center"])
        self.assertEqual(system_object.server_user_rate, icharger_defaults["server_user_rate"])
        self.assertEqual(system_object.server_user_op_angle, icharger_defaults["server_user_op_angle"])

        self.assertEqual(system_object.modbus_mode, icharger_defaults["modbus_mode"])
        self.assertEqual(system_object.modbus_serial_addr, icharger_defaults["modbus_serial_addr"])
        self.assertEqual(system_object.modbus_serial_baud_rate, icharger_defaults["modbus_serial_baud_rate"])
        self.assertEqual(system_object.modbus_serial_parity, icharger_defaults["modbus_serial_parity"])
