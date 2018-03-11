import json
import logging

import RPi.GPIO as GPIO
from schematics.exceptions import ModelConversionError

from electric.models import CaseFan

logger = logging.getLogger('electric.worker.casefancontrol')


class CaseFanControl:
    def __init__(self, load_preferences=True, testing=False):
        self.fan = CaseFan()
        self.testing = testing
        GPIO.setmode(GPIO.BCM)

        if load_preferences:
            self.load_prefs()
            self.save_prefs()
            GPIO.setup(self.fan_pin, GPIO.OUT, initial=GPIO.LOW)

    @property
    def fan_pin(self):
        return self.fan.gpio

    def set_fan_state(self, temp):
        if not self.fan.control:
            return

        thresh = self.fan.threshold
        hyst = self.fan.hysteresis
        output_state = GPIO.input(self.fan_pin)
        if output_state == 0 and temp >= thresh:
            logger.info('Threshold: {0}, Hysteresis: {1}, Charger Temp: {2}, Turning case fan on'.format(thresh, hyst, temp))
            GPIO.output(self.fan_pin, GPIO.HIGH)
        elif output_state == 1 and temp <= thresh - hyst:
            logger.info('Threshold: {0}, Hysteresis: {1}, Charger Temp: {2}, Turning case fan off'.format(thresh, hyst, temp))
            GPIO.output(self.fan_pin, GPIO.LOW)
        self.fan.running = (GPIO.input(self.fan_pin) == 1)

    def set_control_onoff(self, onoff):
        self.fan.control = onoff

    def get_control_onoff(self):
        return self.fan.control

    def set_temp_threshold(self, temp):
        try:
            self.fan.threshold = int(temp)
        except ValueError:
            pass

    def get_temp_threshold(self):
        return self.fan.threshold

    def set_temp_hysteresis(self, hysteresis):
        try:
            self.fan.hysteresis = int(hysteresis)
        except ValueError:
            pass

    def get_temp_hysteresis(self):
        return self.fan.hysteresis

    def set_gpio_pin(self, pin):
        try:
            self.fan.gpio = int(pin)
            GPIO.setup(self.fan_pin, GPIO.OUT, initial=GPIO.LOW)
        except ValueError:
            pass

    def get_gpio_pin(self):
        return self.fan.gpio

    @property
    def preferences_name(self):
        if self.testing:
            return "/opt/prefs/fan_control_test.json"
        return '/opt/prefs/fan_control.json'

    def save_prefs(self):
        json_for_prefs = self.fan.to_primitive()
        with open(self.preferences_name, 'w') as f:
            json.dump(json_for_prefs, f)
        return self.fan

    def load_prefs(self):
        try:
            with open(self.preferences_name, 'r') as f:
                json_preferences = json.load(f)
                self.fan = CaseFan(json_preferences)
        except ModelConversionError, ex:
            # If it doesn't load, use defaults
            self.fan = CaseFan()
        except EnvironmentError:
            self.fan = CaseFan()
