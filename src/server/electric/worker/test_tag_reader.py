import time
import rfidtagio

reader = rfidtagio.instance()
reader.start()
i = 0
try:
    while i < 60:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            raise
        finally:
            i += 1
            if i % 5 == 0:
                print reader.get_tag_list().to_native()
                print
except KeyboardInterrupt:
   print "Aborted."
else:
   reader.stop()
   print "Final list:"
   print reader.get_tag_list().to_native()
finally:
   reader.exit()
