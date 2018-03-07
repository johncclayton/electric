import time
import rfidtagio

rfidtagio.start_tag_reader()
i = 0
try:
    while i < 60:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            raise
        finally:
            i += 1
except KeyboardInterrupt:
   print "Aborted."
else:
   print rfidtagio.get_tag_read_data()
finally:
   rfidtagio.stop_tag_reader()
