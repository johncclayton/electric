import sys

from rq import Worker
from icharger import modbus_usb
from icharger import models
from icharger import comms_layer

class DockerWorker(Worker):
    # def main_work_horse(self, *args, **kwargs):
    #     raise NotImplementedError("Test worker does not implement this method")
    #
    # # def handle_exception(self, job, *exc_info):
    # #     print "Exception during job - terminating worker bye bye"
    # #     sys.exit(1)
    #
    # def execute_job(self, *args, **kwargs):
    #     """Execute job in same thread/process, do not fork()"""
    #     return self.perform_job(*args, **kwargs)
    pass
