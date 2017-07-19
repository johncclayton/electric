import struct, os, time, logging
from datetime import datetime
logger = logging.getLogger('electric.app.{0}'.format(__name__))

def netfmt_int(value):
    result = struct.pack(">L", value)
    return result


def netfmt_string(value):
    str_format = ">{0}s".format(len(value))
    result = netfmt_int(len(value)) + struct.pack(str_format, value)
    return result


def readnet_dword(buff, offset):
    (value,) = struct.unpack_from(">L", buff, offset)
    return value, offset + 4


def readnet_string(buff, len, offset):
    str_format = ">{0}s".format(len)
    (str_value,) = struct.unpack_from(str_format, buff, offset)
    return str_value.rstrip(), offset + len

def data_readable(data):
    return [ord(i) for i in data]


class LogRecord:
    '''
    Same thing as in the Win32 app - captures the time, operation, info/data/len etc of the packets
    '''
    timestamp = None
    op = 0
    info = None
    data = None
    datalen = 0
    ms = 0
    result = 0

    def __init__(self, op = 0, info = "", data = None, len = 0, ms = 0, result = 0):
        self.timestamp = time.localtime()
        self.op = op
        self.info = info
        self.data = data
        self.datalen = len
        self.ms = ms
        self.result = result

    def netfmt(self):
        value = netfmt_string(time.asctime(self.timestamp)) + \
                netfmt_int(self.op) + \
                netfmt_string(self.info) + \
                netfmt_string(self.data) + \
                netfmt_int(self.ms) + \
                netfmt_int(self.result)
        return value

    def readfrom(self, buff, offset):
        (time_len, offset) = readnet_dword(buff, offset)
        (self.timestamp, offset) = readnet_string(buff, time_len, offset)
        (self.op, offset) = readnet_dword(buff, offset)
        (info_len, offset) = readnet_dword(buff, offset)
        (self.info, offset) = readnet_string(buff, info_len, offset)
        (self.datalen, offset) = readnet_dword(buff, offset)
        (self.data, offset) = readnet_string(buff, self.datalen, offset)
        (self.ms, offset) = readnet_dword(buff, offset)
        (self.result, offset) = readnet_dword(buff, offset)
        return offset

    def json(self):
        v = self.__dict__

        o = v["op"]
        if o == 0:
            v["op"] = "READ"
        else:
            v["op"] = "WRITE"

        return v

    @staticmethod
    def display_live(r, i):
        v = r.json()
        return "{0} {1} op: {2}, datalen: {3}, {4}".format(i, v["info"], v["op"], v["datalen"], data_readable(v["data"][:45]))

class Capture:
    '''
    Makes it a tad easier to write the same binary logging format of USB data for comparison purposes.
    '''

    READ = 0
    WRITE = 1

    def __init__(self, cap_path = None):
        self.log_records = []
        self.log_context = []
        self.log_records_added = 0
        self.capture_path = os.environ.get("CAPTURE_PATH", cap_path)
        self.display_live = os.environ.get("CAPTURE_LIVE", False)

        if self.capture_path is not None:
            if not os.path.exists(self.capture_path):
                os.mkdir(self.capture_path)

    def write_logs(self):
        now = datetime.now()

        path = os.path.join(self.capture_path, now.strftime("%Y-%m-%d_%H-%M-%S-junsi-python.dat"))
        capture_file = open(path, "wb+")

        # fake the number of entries just so the comparison code can be easier
        count = len(self.log_records)
        capture_file.write(netfmt_int(count))
        for rec in self.log_records:
            capture_file.write(rec.netfmt())

        capture_file.close()

        return path

    def push_operation(self, info):
        # print "operation info:", info
        self.log_context.append(info)

    def pop_operation(self):
        self.log_context = self.log_context[:-1]

    def context_as_string(self):
        return "**##".join(self.log_context)

    def log_write(self, data, result):
        assert(type(data) == str)
        l = LogRecord(Capture.WRITE, self.context_as_string(), data, len(data), 0, result)
        self.add(l)

    def log_read(self, max_length, ms, expected_len, data_read):
        assert (type(data_read) == str)
        l = LogRecord(Capture.READ, self.context_as_string(), data_read, expected_len, 0, 0)
        self.add(l)

    def add(self, r):
        self.log_records.append(r)
        self.log_records_added += 1
        if self.display_live:
            logging.info(LogRecord.display_live(r, self.log_records_added))
        if len(self.log_records) > 100:
            self.log_records = self.log_records[-50:]