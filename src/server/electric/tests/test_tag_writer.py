import sys
import time
import electric.worker.rfidtagio
import electric.models

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

    batt_info = { "battery id":battery_id, "chemistry":chemistry, \
                  "cell count":cells, "capacity":capacity, \
                  "c rating":c_rating, "max charge c":max_charge_rate, \
                  "charge rate":charge_rate, "discharge rate":discharge_rate, \
                  "cycle count":cycles }
    print batt_info
    answer = raw_input("Is this correct? [y,N] ")
    if answer != "Y" and answer != "y":
        raise KeyboardInterrupt
except KeyboardInterrupt:
    sys.exit()
    
try:
    rfid_tag = RFIDTag(batt_info)
    writer = rfidtagio.TagWriter.instance()
    writer.start(rfid_tag)
    result = writer.get_result()
    while result == rfidtagio.TagWriter.IN_PROGRESS \
          or result == None:
        time.sleep(1)
        result = writer.get_result()
    if result == rfidtagio.TagWriter.USED_TAG:
        answer = raw_input("Tag already written. Rewrite? [y/N] ")
        if answer == "y" or answer == "Y":
            writer.exit()
            writer = rfidtagio.TagWriter.instance()
            writer = rfidtagio.start(rfid_tag, force=True)
            result = writer.get_result()
            while result == rfidtagio.TagWriter.IN_PROGRESS
                  or result == None:
                time.sleep(1)
                result = writer.get_result()

except KeyboardInterrupt:      
    print "Aborted."

else:
    print "Write result:", result

finally:
    writer.exit()
