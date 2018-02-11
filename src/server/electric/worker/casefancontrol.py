import RPi.GPIO as GPIO
import json

class CaseFanControl:
    prefs = { 'control':'off', 'threshold':100, 'C':3, 'F':5, 'gpio':23 }

    def __init__(self):
        self.load_prefs()
        self.running = False
        self.fan_pin = prefs['gpio'];
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(fan_pin, GPIO.OUT, initial = GPIO.LOW)

    def set_fan_state(self, channel_status):
        if prefs['control'] == 'off':
            return
        system_storage = get_system_storage()
        temp = channel_status.curr_int_temp
        unit = system_storage.temp_unit
        thresh = prefs['threshold']
        running = prefs['running']
        if !self.running and temp >= thresh:
            GPIO.output(self.fan_pin, GPIO.HIGH)
            self.running = True
        elif self.running and temp <= (thresh - prefs[unit]):
            GPIO.output(self.fan_pin, GPIO.LOW)
            self.running = False

    def set_temp_threshold(self, temp):
        try:
            prefs['threshold'] = int(temp)
            self.save_prefs()
        except ValueError:

    def get_temp_threshold(self):
        return prefs['threshold']

    def set_control_onoff(self, onoff):
        prefs['control'] = 'on' if onoff == 'on' else 'off'
        self.save_prefs()

    def get_control_onoff(self):
        return prefs['control']

    def save_prefs(self):
        with open('/prefs/fan_control.json', 'w') as f:
            json.dump(prefs, f);

    def load_prefs(self)
        with open('prefs/fan_control.json', 'r') as f:
            prefs = json.load(f)
