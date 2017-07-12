# let me start by saying: man am I glad I don't use C++ any more.  sheeesh.
import struct, sys

'''
Data format is as follows:
    DWORD, number of entries

    each entry:
        DWORD len
        BYTES<len> time (str, gmt)
        DWORD op (just an int, enum, READ=0, WRITE=1)
        DWORD len
        BYTES<len> info (str)
        DWORD len
        BYTES<data> (the data transmission to/from charger)
        DWORD ms (timeout value, hardly used, captured for kicks)
        DWORD result (BOOL result of read()/write() call on USB bus for Win32)
    
    good luck.
'''

def ReadNet_DWORD(buff, offset):
    (value,) = struct.unpack_from("!L", buff, offset)
    return value, offset + 4

def ReadNet_STR(buff, len, offset):
    str_format = "!{0}s".format(len)
    (str_value,) = struct.unpack_from(str_format, buff, offset)
    return str_value.rstrip(), offset + len

def ReadNet_LogRecord(buff, offset):
    (time_len, offset) = ReadNet_DWORD(buff, offset)
    (time_str, offset) = ReadNet_STR(buff, time_len, offset)
    (op, offset) = ReadNet_DWORD(buff, offset)
    (info_len, offset) = ReadNet_DWORD(buff, offset)
    (info_str, offset) = ReadNet_STR(buff, info_len, offset)
    (data_len, offset) = ReadNet_DWORD(buff, offset)
    (data, offset) = ReadNet_STR(buff, data_len, offset)
    (ms, offset) = ReadNet_DWORD(buff, offset)
    (result, offset) = ReadNet_DWORD(buff, offset)
    return ({
        "time": time_str,
        "op": op,
        "info": info_str,
        "data": data,
        "ms": ms,
        "result": result
            }, offset)

def convert_log_records_from(content):
    num_records, offset = ReadNet_DWORD(content, 0)
    while num_records:
        record, offset = ReadNet_LogRecord(content, offset)
        print("record is:", record)
        num_records = num_records - 1

if __name__ == "__main__":
    filename = sys.argv[1]
    with open(filename, "rb") as input_file:
        content = input_file.read()
        convert_log_records_from(content)