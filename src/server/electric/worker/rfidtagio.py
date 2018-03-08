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
from electric.models import RFIDTag, RFIDTagList

logger = logging.getLogger('electric.worker.rfidtagio')
lone_thread = None

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
                   62: { CHEMISTRY_KEY     :( 0, 2 ),   \
                         C_CHARGE_MAX_KEY  :( 2, 2 ),   \
                         CHARGE_RATE_KEY   :( 4, 4 ),   \
                         DISCHARGE_RATE_KEY:( 8, 4 ) } }
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
            logger.info("detect_tag: (status,self.tag_uid) = (", status, ",", \
                        self.tag_uid, ")")
            if status == self.read_writer.MI_OK:
                type = self.read_writer.MFRC522_SelectTag(self.tag_uid)
                if type == self.REVO_TAG or type == self.RCT_TAG:
                    return (type,self.tag_uid)
        return (None, None)

    @classmethod
    def get_schema(cls, type):  # Provide a copy so it doesn't get corrupted
        if type == cls.RCT_TAG:
            return (copy.deepcopy(cls.RCT_SCHEMA), True)    # Writable = True
        elif type == cls.REVO_TAG:
            return (copy.deepcopy(cls.REVO_SCHEMA), False)  # Writable = False
        else:
            return (None, None)

    def read_block(self, block):
        print "tag_uid = ", self.tag_uid
        print "block = ", block
        trailer_block = block // 4 * 4 + 3
        print "trailer_block =",trailer_block,"last =",self.last_trailer_block
        if trailer_block != self.last_trailer_block:
            self.read_writer.MFRC522_StopCrypto1()
            status = self.read_writer.MFRC522_Auth( \
                                      self.read_writer.PICC_AUTHENT1A, \
                                      block, self.AUTH_KEY, self.tag_uid)
            print "After read Auth: AUTH_KEY =", self.AUTH_KEY
            if status != self.read_writer.MI_OK:
                return None
            else:
                self.last_trailer_block = trailer_block
        data = self.read_writer.MFRC522_Read(block)
        print "block[",block,"] = ",data
        return data

    def write_block(self, block, data):
        print "tag_uid = ", self.tag_uid
        print "block = ", block
        trailer_block = block // 4 * 4 + 3
        "trailer_block =",trailer_block,"last =",self.last_trailer_block
        if trailer_block != self.last_trailer_block:
            self.read_writer.MFRC522_StopCrypto1()
            status = self.read_writer.MFRC522_Auth(self.read_writer.PICC_AUTHENT1A, \
                                                  block, \
                                                  self.AUTH_KEY, self.tag_uid)
            print "After write Auth: AUTH_KEY =", self.AUTH_KEY
            if status != self.read_writer.MI_OK:
                return None
            else:
                self.last_trailer_block = trailer_block
                status = self.read_writer.MFRC522_Read(trailer_block)
                if status != cls.read_writer.MI_OK:
                    return None
        print "write block, data = ", block, ",",data
        self.read_writer.MFRC522_Write(block, data)
        data = self.read_writer.MFRC522_Read(block)
        print "read back block, data = ", block, ",",data
        return data

    def read_tag(self, schema):
        batt_dict = {}

        for block in schema.keys():
            print "block in schema.keys =", block
            data = self.read_block(block)
            print "data in block =", data
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
            print "batt_dict = ", batt_dict

            for param in block_dict.keys():
                posn_tuple = block_dict[param]
                print "posn_tuple = ", posn_tuple
                start_byte = posn_tuple[0]
                print "start_byte = ", start_byte
                byte_len = posn_tuple[1]
                print "byte_len = ", byte_len
                value = batt_dict[param]
                print "value = ", value

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
                print "block =", block, "data =",data

            # Don't write the block if nothing changed
            print "Data after conversion from batt_dict =", data
            current_data = self.read_block(block)
            print "Data currently in target block =", current_data
            if current_data != data:
                print "New data to write!"
                if self.write_block(block, data) == None:
                    return None

        print "data = ", data
        return self.read_tag(schema)

    def reset(self):
        self.read_writer.MFRC522_Init()
        self.last_trailer_block = None        
    
class TagReader(threading.Thread):
    @staticmethod
    def instance():
        if lone_thread == None:
            lone_thread = TagReader()
        elif type(lone_thread).__name__ == "TagWriter":
            lone_thread.exit()
            lone_thread = TagReader()
        return lone_thread
            
    def __init__(self):
        super(TagReader, self).__init__(name="Read RFID tags")
        self.loop_done = False
        self.tags = RFIDTagList({ "tag_list":[] })

    def start(self):
        if self.loop_done:
            lone_thread.exit()
            TagReader.instance().start()
        elif self.is_alive():
            self.stop()
            self.start()
        else:
            super(TagReader, self).start()
            
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
                print "post-read batt_dict = ", batt_dict
                if batt_dict != None and writable:
                    # Increment cycle count if needed
                    print "post-read batt_dict = ", batt_dict
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
            print "preregister_batt_dict = ", batt_dict
            chemistry = None
            cells = None
            for rfid_tag in self.tags.tag_list:
                if (chemistry == None): chemistry = rfid_tag[tio.CHEMSTRY_KEY]
                if (cells == None): cells = rfid_tag[tio.CHEMISTRY_KEY]
                if rfid_tag[tio.BATTERY_ID_KEY] == \
                                                 batt_dict[tio.BATTERY_ID_KEY] \
                   and rfid_tag[tio.TAG_UID_KEY] == uid:
                    chemistry = None
                    cells = None
                    break
                    
            # Only allow the tag to be added to the list if:
            # 1. The list is empty, or
            # 2. The tag is not already in the list and the chemistry and
            #    cell count in the new tag match that of the existing tags
            if self.tags.tag_list == [] \
               or (batt_dict[tio.CHEMISTRY_KEY] == chemistry \
                   and batt_dict[tio.CELLS_KEY] == cells):
                batt_dict[tio.TAG_UID_KEY] = uid
                #self.tags.tag_list.append(RFIDTag(batt_dict))
                self.tags.tag_list.append(batt_dict) # Don't know if this will work
        
    def stop(self):
        self.loop_done = True
        self.join()

    def get_tag_list(self):
        return self.tags

    def exit(self):
        self.stop()
        lone_thread = None

class TagWriter(threading.Thread):
    SUCCESS = 0
    IN_PROGRESS = 1
    FAILED = 2
    USED_TAG = 3
    READONLY_TAG = 4
    INVALID_TAG = 5

    @staticmethod
    def instance():
        if lone_thread == None:
            lone_thread = TagWriter()
        elif type(lone_thread).__name__ == "TagReader":
            lone_thread.exit()
            lone_thread = TagWriter()
        return lone_thread
    
    def __init__(self):
        super(TagWriter, self).__init__(name="Write RFID tag")
        self.loop_done = False
        self.write_result = None

    def start():
        print "start() requires at least an RFIDTag argument in this class"
        
    def start(self, rfid_tag, **kwargs):
        if self.loop_done:
            lone_thread.exit()
            TagReader.instance().start(rfid_tag, **kwargs)
        elif self.is_alive():
            self.stop()
            self.start(rfid_tag, **kwargs)
        else:
            self.rfid_tag = rfid_tag
            self.force = kwargs.get("force", False)
            super(TagWriter, self).start()  # Spin up the thread
            
    def run(self):
        self.write_result = self.IN_PROGRESS
        tio = TagIO()
        while not self.loop_done:
            tio.reset()
            (type, uid) = tio.detect_tag()
            if uid == None:
                continue

            (schema, writable) = tio.get_schema(type)
            if schema != None:
                if not writable:
                    self.write_result = self.READONLY_TAG
                    self.loop_done = True
                    break
                if not self.force:
                    batt_dict = tio.read_tag(schema)
                    print "batt_dict during virginity check =", batt_dict
                    # Capacity should be 0 on a virgin tag
                    if batt_dict[tio.CAPACITY_KEY] != 0:
                        # Tag already written; must use force to overwrite
                        self.write_result = self.USED_TAG
                        self.loop_done = True
                        break
            else:
                self.write_result = self.INVALID_TAG
                self.loop_done = True
                break

            if tio.write_tag(schema, self.rfid_tag.to_native()) == None:
                self.write_result = self.FAILED
            else:
                self.write_result = self.SUCCESS
            self.loop_done = True

    def get_result(self):
        return self.write_result
    
    def exit(self):
        self.loop_done = True
        self.join()
        lone_thread = None
