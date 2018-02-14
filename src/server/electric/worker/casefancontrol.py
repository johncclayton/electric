import RPi.GPIO as GPIO
import json
import logging
from cache import Cache

logger = logging.getLogger('electric.worker.casefancontrol')

class CaseFanControl:
    prefs = { 'control':'on', 'threshold':37, 'tolerance':3, 'gpio':23 }

    def __init__(self):
        self.load_prefs()
        self.running = False
        self.fan_pin = self.prefs['gpio'];
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.fan_pin, GPIO.OUT, initial = GPIO.LOW)

    def set_fan_state(self, channel_status, cache):
        if self.prefs['control'] == 'off':
            return
        temp = channel_status.curr_int_temp
        thresh = self.prefs['threshold']
        tolerance = self.prefs['tolerance']
        running = cache.values.get_case_fan_run_state()
        if not running and temp >= thresh:
            logger.info('Turning case fan on')
            GPIO.output(self.fan_pin, GPIO.HIGH)
            cache.values.set_case_fan_run_state(True)
        elif running and temp <= thresh - tolerance:
            logger.info('Turning case fan off')
            GPIO.output(self.fan_pin, GPIO.LOW)
            cache.values.set_case_fan_run_state(False)

    def set_control_onoff(self, onoff):
        self.prefs['control'] = 'on' if onoff == 'on' else 'off'
        self.save_prefs()

    def get_control_onoff(self):
        return self.prefs['control']

    def set_temp_threshold(self, temp):
        try:
            self.prefs['threshold'] = int(temp)
            self.save_prefs()
        except ValueError:
            pass

    def get_temp_threshold(self):
        return self.prefs['threshold']

    def set_temp_tolerance(self, tolerance):
        try:
            self.prefs['tolerance'] = int(tolerance)
            self.save_prefs()
        except ValueError:
            pass

    def get_temp_tolerance(self):
        return self.prefs['tolerance']

    def set_gpio_pin(self, pin):
        try:
            self.prefs['gpio'] = int(pin)
            self.save_prefs()
        except ValueError:
            pass

    def get_gpio_pin(self):
        return self.prefs['gpio']

    def save_prefs(self):
        with open('/opt/prefs/fan_control.json', 'w') as f:
            json.dump(self.prefs, f);

    def load_prefs(self):
        try:
            with open('/opt/prefs/fan_control.json', 'r') as f:
                self.prefs = json.load(f)
        except EnvironmentError:
            pass
