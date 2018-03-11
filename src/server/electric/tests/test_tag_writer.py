import sys
import time
from electric.worker.rfidtagio import TagIO, TagWriter
from electric.models import RFIDTag, RFIDTagOpStatus

try:
    battery_id = int(raw_input("Battery ID? "))
    chemistry = \
       int(raw_input( \
               "Chemistry? [0=LiPo,1=LiLo,2=LiFe,3=NiNH,4=NiCd,5=Pb,6=NiZn] "))
    cells = int(raw_input("Number of cells? "))
    capacity = int(raw_input("Capacity (mAh)? "))
    c_rating = int(raw_input("C rating (excluding \"C\")? "))
    max_charge_rate = int(raw_input("Max charge rate (C)? "))
    charge_rate = int(raw_input("Desired charge rate (mAh)? "))
    discharge_rate = int(raw_input("Desired discharge rate (mAh)? "))
    cycles = int(raw_input("Initial cycle count? "))

    batt_info = { TagIO.BATTERY_ID_KEY:battery_id, \
                  TagIO.CHEMISTRY_KEY:chemistry, \
                  TagIO.CELLS_KEY:cells, \
                  TagIO.CAPACITY_KEY:capacity, \
                  TagIO.C_RATING_KEY:c_rating, \
                  TagIO.C_CHARGE_MAX_KEY:max_charge_rate, \
                  TagIO.CHARGE_RATE_KEY:charge_rate, \
                  TagIO.DISCHARGE_RATE_KEY:discharge_rate, \
                  TagIO.CYCLES_KEY:cycles }
    print batt_info
    answer = raw_input("Is this correct? [y,N] ")
    if answer != "Y" and answer != "y":
        raise KeyboardInterrupt
except KeyboardInterrupt:
    sys.exit()
    
try:
    print "Starting the write process..."
    rfid_tag = RFIDTag(batt_info)
    print "rfid_tag contents =", rfid_tag.to_native()
    writer = TagWriter.instance()
    writer.start(rfid_tag)
    result = writer.get_result()
    while result["status"] == RFIDTagOpStatus.Running \
          or result["status"] == RFIDTagOpStatus.Ready:
        time.sleep(1)
        result = writer.get_result()
    if result["status"] == RFIDTagOpStatus.UsedTag:
        answer = raw_input("Tag already written. Rewrite? [y/N] ")
        if answer == "y" or answer == "Y":
            writer.exit()
            writer = TagWriter.instance()
            writer.start(rfid_tag, force=True)
            result = writer.get_result()
            while result["status"] == RFIDTagOpStatus.Running \
                  or result["status"] == RFIDTagOpStatus.Ready:
                time.sleep(1)
                result = writer.get_result()

except KeyboardInterrupt:      
    print "Aborted."

else:
    print "Write result:", result

finally:
    writer.exit()
