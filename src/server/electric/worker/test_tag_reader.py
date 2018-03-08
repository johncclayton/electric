import time
import rfidtagio

rfidtagio.instance().start()
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
   rfidtagio.instance().stop()()
   print rfidtagio.get_tag_read_data()
   rfidtagio.instance().exitr()()
