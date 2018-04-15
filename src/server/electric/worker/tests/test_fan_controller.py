import unittest

from electric.worker.casefancontrol import CaseFanControl
import RPi.GPIO as GPIO


class FanControllerTest(unittest.TestCase):
    def setUp(self):
        self.fan_controller = CaseFanControl(testing=True)
        self.fan_controller.set_control_onoff(True)

    def test_new_instance_has_defaults(self):
        self.fan_controller = CaseFanControl(load_preferences=False, testing=True)
        self.assertGreaterEqual(self.fan_controller.fan.threshold, 30)
        self.assertGreaterEqual(self.fan_controller.fan.hysteresis, 1)
        self.assertFalse(self.fan_controller.fan.control, False)

    def test_persists_changes(self):
        self.fan_controller.set_temp_threshold(60)
        self.fan_controller.save_prefs()

        self.fan_controller = CaseFanControl()
        self.assertEqual(self.fan_controller.fan.threshold, 60)

    def test_changing_gpio_pin_changes_rpio(self):
        self.fan_controller = CaseFanControl(load_preferences=False, testing=True)

        # Force 22 to be INPUT, so that we can check that the fan controller IS setting the hardware properly
        GPIO.setup(22, GPIO.IN)

        # default is 23
        self.assertEqual(self.fan_controller.get_gpio_pin(), 23)
        self.fan_controller.set_gpio_pin(22)
        self.assertEqual(self.fan_controller.get_gpio_pin(), 22)
        self.assertEqual(GPIO.gpio_function(self.fan_controller.get_gpio_pin()), GPIO.OUT)

    def test_can_set_fan_control(self):
        self.fan_controller.set_control_onoff(False)
        self.assertFalse(self.fan_controller.get_control_onoff())

        self.fan_controller.set_control_onoff(True)
        self.assertTrue(self.fan_controller.get_control_onoff())

    def test_changing_temp_turns_on_fan(self):
        self.fan_controller.set_temp_hysteresis(1)
        self.fan_controller.set_temp_threshold(30)

        self.fan_controller.set_fan_state(29)
        self.assertFalse(self.fan_controller.fan.running)

        # Must be >= 30 to turn on
        self.fan_controller.set_fan_state(30)
        self.assertTrue(self.fan_controller.fan.running)

        # If hysteresis is changed, must drop by that to turn off
        self.fan_controller.set_temp_hysteresis(5)
        self.fan_controller.set_fan_state(26)
        self.assertTrue(self.fan_controller.fan.running)

        self.fan_controller.set_fan_state(25)
        self.assertFalse(self.fan_controller.fan.running)
