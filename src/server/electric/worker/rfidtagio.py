# Requires the MFRC522.py Python module available here:
#    https://github.com/pimylifeup/MFRC522-python

import datetime
import threading
import time
import logging
import copy
import MFRC522
from Queue import Queue
import RPi.GPIO as GPIO
from schematics.exceptions import ModelValidationError
from electric.models import RFIDTagOpStatus, RFIDTag, RFIDTagList

logger = logging.getLogger('electric.worker.rfidtagio')
lone_thread = None

class LEDControl:
    Amber = { 16:GPIO.HIGH, 20:GPIO.HIGH }
    Red =   { 16:GPIO.HIGH, 20:GPIO.LOW }
    Green = { 16:GPIO.LOW,  20:GPIO.HIGH }
    Off =   { 16:GPIO.LOW,  20:GPIO.LOW }
    current_color = None

    @classmethod
    def set_color(cls, color):
        for key in color.keys():
            try:
                GPIO.output(key, color[key])
            except:
                GPIO.setmode(GPIO.BCM)
                GPIO.setup(key, GPIO.OUT)
                GPIO.output(key, color[key])
        old_color = cls.current_color
        cls.current_color = color
        return old_color

    @classmethod
    def get_current_color(cls):
        return cls.current_color

    @classmethod
    def flash(cls, times, **kwargs):
        if times <= 0:
            return
        period = 0.25
        color1 = cls.get_current_color()
        color2 = cls.Off
        for key, value in kwargs.items():
            if key == "period":
                period = value
            elif key == "color1":
                color1 = value
            elif key == "color2":
                color2 = value
        saved_color = cls.get_current_color()
        cls.set_color(color1)
        for x in range(times):
            time.sleep(period / 2)
            prev_color = cls.set_color(color2)
            time.sleep(period / 2)
            cls.set_color(color1)
        cls.set_color(saved_color)

class TagIO:
    RCT_TAG  = 0x08     # MIFARE 1K
    REVO_TAG = 0x00     # MIFARE UL
    AUTH_KEY = (0xFF,0xFF,0xFF,0xFF,0xFF,0xFF)

    # MUST match the member names in the RFIDTag model definition
    BATTERY_ID_KEY = "battery_id"
    TAG_UID_KEY = "tag_uid"
    CHEMISTRY_KEY = "chemistry"
    CAPACITY_KEY = "capacity"
    CELLS_KEY = "cells"
    C_RATING_KEY = "c_rating"
    C_CHARGE_MAX_KEY = "c_charge_limit"
    CHARGE_RATE_KEY = "charge_mA"
    DISCHARGE_RATE_KEY = "discharge_mA"
    CYCLES_KEY = "cycles"
    
    RCT_SCHEMA = { 60: { BATTERY_ID_KEY    :( 0, 2 ),   \
                         CAPACITY_KEY      :( 2, 2 ),   \
                         CYCLES_KEY        :( 4, 2 ),   \
                         CELLS_KEY         :( 6, 2 ) }, \
                   61: { C_RATING_KEY      :( 0, 2 ) }, \
                   62: { CHEMISTRY_KEY     :( 0, 1 ),   \
                         C_CHARGE_MAX_KEY  :( 1, 1 ),   \
                         CHARGE_RATE_KEY   :( 2, 3 ),   \
                         DISCHARGE_RATE_KEY:( 5, 3 ) } }
    REVO_SCHEMA = {}

    def __init__(self):
        self.read_writer = MFRC522.MFRC522()
        self.tag_uid = None
        self.last_trailer_block = None

    def detect_tag(self):
        time.sleep(0.5)
        (status,req_type) = \
                  self.read_writer.MFRC522_Request(self.read_writer.PICC_REQIDL)
        if status == self.read_writer.MI_OK:
            (status,self.tag_uid) = self.read_writer.MFRC522_Anticoll()
            #logger.info("detect_tag: (status,self.tag_uid) = (", status, ",", \
            #            self.tag_uid, ")")
            if status == self.read_writer.MI_OK:
                type = self.read_writer.MFRC522_SelectTag(self.tag_uid)
                if type == self.REVO_TAG or type == self.RCT_TAG:
                    return (type,self.tag_uid)
        return (None, None)

    @classmethod
    def get_schema(cls, tag_type):  # Provide a copy so it doesn't get corrupted
        if tag_type == cls.RCT_TAG:
            return (copy.deepcopy(cls.RCT_SCHEMA), True)    # Writable = True
        elif tag_type == cls.REVO_TAG:
            return (copy.deepcopy(cls.REVO_SCHEMA), False)  # Writable = False
        else:
            return (None, None)

    def read_block(self, block):
        trailer_block = block // 4 * 4 + 3
        if trailer_block != self.last_trailer_block:
            self.read_writer.MFRC522_StopCrypto1()
            status = self.read_writer.MFRC522_Auth( \
                                      self.read_writer.PICC_AUTHENT1A, \
                                      block, self.AUTH_KEY, self.tag_uid)
            if status != self.read_writer.MI_OK:
                return None
            else:
                self.last_trailer_block = trailer_block
        data = self.read_writer.MFRC522_Read(block)
        return data

    def write_block(self, block, data):
        trailer_block = block // 4 * 4 + 3
        "trailer_block =",trailer_block,"last =",self.last_trailer_block
        if trailer_block != self.last_trailer_block:
            self.read_writer.MFRC522_StopCrypto1()
            status = self.read_writer.MFRC522_Auth(self.read_writer.PICC_AUTHENT1A, \
                                                  block, \
                                                  self.AUTH_KEY, self.tag_uid)
            if status != self.read_writer.MI_OK:
                return None
            else:
                self.last_trailer_block = trailer_block
                status = self.read_writer.MFRC522_Read(trailer_block)
                if status != cls.read_writer.MI_OK:
                    return None
        self.read_writer.MFRC522_Write(block, data)
        data = self.read_writer.MFRC522_Read(block)
        return data

    def read_tag(self, schema):
        batt_dict = {}

        for block in schema.keys():
            data = self.read_block(block)
            if data == None:
                return None
            block_dict = schema[block]

            for param in block_dict.keys():
                posn_tuple = block_dict[param]
                start_byte = posn_tuple[0]
                byte_len = posn_tuple[1]

                if byte_len == 1:
                    batt_dict[param] = data[start_byte]
                elif byte_len == 2:
                    batt_dict[param] = (data[start_byte]     << 8) | \
                                        data[start_byte + 1]
                elif byte_len == 3:
                    batt_dict[param] = (data[start_byte]     << 16) | \
                                       (data[start_byte + 1] <<  8) | \
                                        data[start_byte + 2]
                elif byte_len == 4:
                    batt_dict[param] = (data[start_byte]     << 24) | \
                                       (data[start_byte + 1] << 16) | \
                                       (data[start_byte + 2] <<  8) | \
                                        data[start_byte + 3]

        return batt_dict

    def write_tag(self, schema, batt_dict):
        for block in schema.keys():
            data = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            block_dict = schema[block]

            for param in block_dict.keys():
                posn_tuple = block_dict[param]
                start_byte = posn_tuple[0]
                byte_len = posn_tuple[1]
                value = int(batt_dict[param])

                if byte_len == 1:
                    data[start_byte] = value & 0xFF
                elif byte_len == 2:
                    data[start_byte]     = value >> 8
                    data[start_byte + 1] = value & 0xFF
                elif byte_len == 3:
                    data[start_byte]     = value >> 16
                    data[start_byte + 1] = (value >> 8) & 0xFF
                    data[start_byte + 2] = value & 0xFF
                elif byte_len == 4:
                    data[start_byte]     = value >> 24
                    data[start_byte + 1] = (value >> 16) & 0xFF
                    data[start_byte + 2] = (value >> 8) & 0xFF
                    data[start_byte + 3] = value & 0xFF

            # Don't write the block if nothing changed
            current_data = self.read_block(block)
            if current_data != data:
                if self.write_block(block, data) == None:
                    return None

        return self.read_tag(schema)

    def reset(self):
        self.read_writer.MFRC522_Init()
        self.last_trailer_block = None        

class TagReader(threading.Thread):
    @staticmethod
    def instance():
        global lone_thread
        print "TagReader: lone_thread type =", type(lone_thread).__name__
        if lone_thread == None:
            print "CREATING A NEW READER FROM NOTHING"
            lone_thread = TagReader()
        elif type(lone_thread).__name__ == "TagWriter":
            print "KILLING AN EXISTING WRITER"
            lone_thread.exit()
            print "CREATING A NEW READER"
            lone_thread = TagReader()
        return lone_thread
            
    def __init__(self):
        super(TagReader, self).__init__(name="Read RFID tags")
        self.loop_done = False
        self.status = RFIDTagOpStatus.Ready
        self.tags = RFIDTagList({ "tag_list":[] })

    def start(self):
        global lone_thread
        if self.loop_done:
            self.exit()
            return self.instance().start()
        elif not self.is_alive():
            super(TagReader, self).start()
            self.status = RFIDTagOpStatus.Running
            LEDControl.set_color(LEDControl.Green)
        return { "status":self.status }
            
    def run(self):
        prev_uid = None
        tio = TagIO()
        while not self.loop_done:
            tio.reset()
            (type, uid) = tio.detect_tag()
            if uid == None or uid == prev_uid:
                continue
            prev_uid = uid

            (schema, writable) = tio.get_schema(type)
            if schema != None:
                batt_dict = tio.read_tag(schema)
                if batt_dict != None and writable:
                    # Increment cycle count if needed
                    if False:# If the battery has been cycled since the last bump:
                        batt_dict[tio.CYCLES_KEY] += 1
                        new_batt_dict = tio.write_tag(schema, batt_dict)
                        if new_batt_dict != None:
                            batt_dict = new_batt_dict
                            # Reset the "cycled" flag for this battery
            else:
                print "Invalid tag type: ", type
                continue

            # Check for already scanned and get the chemistry and cell count
            chemistry = None
            cells = None
            for rfid_tag in self.tags.tag_list:
                if (chemistry == None):
                    chemistry = rfid_tag[tio.CHEMISTRY_KEY]
                if (cells == None):
                    cells = rfid_tag[tio.CELLS_KEY]
                if rfid_tag[tio.BATTERY_ID_KEY] == \
                                                 batt_dict[tio.BATTERY_ID_KEY] \
                   and rfid_tag[tio.TAG_UID_KEY] == uid:
                    chemistry = None
                    cells = None
                    # Let the user know the tag was recognized as valid but
                    # already scanned
                    LEDControl.flash(2, period=0.5)
                    break
                    
            # Only allow the tag to be added to the list if:
            # 1. The list is empty, or
            # 2. The tag is not already in the list and the chemistry and
            #    cell count in the new tag match that of the existing tags
            if self.tags.tag_list == [] \
               or (batt_dict[tio.CHEMISTRY_KEY] == chemistry \
                   and batt_dict[tio.CELLS_KEY] == cells):
                batt_dict[tio.TAG_UID_KEY] = uid
                try:
                    rfid_tag = RFIDTag(batt_dict)
                    rfid_tag.validate()
                except ModelValidationError as e:
                    LEDControl.set_color(LEDControl.Red)
                    time.sleep(2)
                    LEDControl.set_color(LEDControl.Green)
                    print "Data error in scanned tag info!"
                    print e
                    print "Tag ignored."
                else:
                    self.tags.tag_list.append(rfid_tag)
                    LEDControl.flash(4)
                    print "Tag added!"
                    print rfid_tag[tio.BATTERY_ID_KEY], \
                          rfid_tag[tio.TAG_UID_KEY]
            elif chemistry != None:
                # We'll flash at a little faster rate for anyone who is
                # colorblind
                LEDControl.flash(6, period=0.167, color1=LEDControl.Red)
        
    def stop(self):
        if self.is_alive():
            self.loop_done = True
            self.join()
        self.status = RFIDTagOpStatus.Stopped
        LEDControl.set_color(LEDControl.Off)
        return { "status":self.status }

    @classmethod
    def get_tag_list(cls):
        if lone_thread != None \
           and type(lone_thread).__name__ == cls.__name__:
            lone_thread.tags["status"] = lone_thread.status
            return lone_thread.tags
        else:
            return RFIDTagList({ "tag_list":[], "status":RFIDTagOpStatus.Dead })

    def exit(self):
        global lone_thread
        self.stop()
        lone_thread = None
        self.status = RFIDTagOpStatus.Dead
        return { "status":self.status }

class TagWriter(threading.Thread):
    status = RFIDTagOpStatus.Dead

    @staticmethod
    def instance():
        global lone_thread
        print "TagWriter: lone_thread type =", type(lone_thread).__name__
        if lone_thread == None:
            print "CREATING A NEW WRITER FROM NOTHING"
            lone_thread = TagWriter()
        elif type(lone_thread).__name__ == "TagReader":
            print "KILLING AN EXISTING READER"
            lone_thread.exit()
            print "CREATING A NEW WRITER"
            lone_thread = TagWriter()
        return lone_thread
    
    def __init__(self):
        super(TagWriter, self).__init__(name="Write RFID tag")
        self.loop_done = False
        self.status = RFIDTagOpStatus.Ready

    def start():
        print "start() requires at least an RFIDTag argument in this class"
        
    def start(self, rfid_tag, **kwargs):
        global lone_thread
        print "TagWriter:", type(rfid_tag)
        if self.loop_done:
            self.exit()
            return self.instance().start(rfid_tag, **kwargs)
        elif not self.is_alive():
            self.rfid_tag = rfid_tag
            self.force = kwargs.get("force", False)
            super(TagWriter, self).start()  # Spin up the thread
            self.status = RFIDTagOpStatus.Running
            LEDControl.set_color(LEDControl.Amber)
        return { "status":self.status }
            
    def run(self):
        tio = TagIO()
        while not self.loop_done:
            tio.reset()
            (type, uid) = tio.detect_tag()
            if uid == None:
                continue

            (schema, writable) = tio.get_schema(type)
            if schema != None:
                if not writable:
                    self.status = RFIDTagOpStatus.ReadOnlyTag
                    self.loop_done = True
                    break
                if not self.force:
                    batt_dict = tio.read_tag(schema)
                    # Capacity should be 0 on a virgin tag
                    if batt_dict[tio.CAPACITY_KEY] != 0:
                        # Tag already written; must use force to overwrite
                        self.status = RFIDTagOpStatus.UsedTag
                        LEDControl.flash(6, period=0.167, color1=LEDControl.Red)
                        # Let's keep going in case the wrong tag was touched
                        #self.loop_done = True
                        #break
                        continue
            else:
                self.status = RFIDTagOpStatus.InvalidTag
                self.loop_done = True
                break

            if tio.write_tag(schema, self.rfid_tag.to_native()) == None:
                self.status = RFIDTagOpStatus.Failed
                LEDControl.set_color(LEDControl.Red)
                time.sleep(2)
            else:
                self.status = RFIDTagOpStatus.Success
                LEDControl.flash(4)
            self.loop_done = True
        self.status = RFIDTagOpStatus.Stopped
        LEDControl.set_color(LEDControl.Off)
        return { "status":self.status }

    @classmethod
    def get_status(cls):
        if lone_thread != None \
           and type(lone_thread).__name__ == type(cls).__name__:
            return { "status":lone_thread.status }
        else:
            return { "status":RFIDTagOpStatus.Dead }
    
    def exit(self):
        global lone_thread
        if self.is_alive():
            self.loop_done = True
            self.join()
        lone_thread = None
        self.status = RFIDTagOpStatus.Dead
        LEDControl.set_color(LEDControl.Off)
        return { "status":self.status }
