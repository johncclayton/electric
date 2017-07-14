# let me start by saying: man am I glad I don't use C++ any more.  sheeesh.
import struct, sys, json, argparse
from electric.icharger.capture import LogRecord, readnet_dword

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


def read_all_records_from(content):
    num_records, offset = readnet_dword(content, 0)
    all_records = []
    while num_records:
        r = LogRecord()
        offset = r.readfrom(content, offset)
        all_records.append(r)
        num_records = num_records - 1

    return all_records


def data_comparison(left, right):
    print(left)
    print "----"
    print(right)


def data_readable(data):
    return [ord(i) for i in data]


def summary_of(all_records):
    f = all_records[0].json()
    start_time = f["timestamp"]

    print "starting at:", start_time

    i = 0
    for r in all_records:
        v = r.json()
        print "{0} {1} op: {2}, {3}, {4}".format(i, v["info"], v["op"], v["datalen"], data_readable(v["data"][:40]))
        i += 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser("compare data outputs")

    parser.add_argument("--left", dest="left", type=argparse.FileType(mode='rb'), help="the left hand side file to compare")
    parser.add_argument("--right", dest="right", type=argparse.FileType(mode='rb'), help="the right hand side file to compare")
    parser.add_argument("--ridx", type=int, dest="ridx", help="when using detailed comparison, the index to use within the right hand side list")
    parser.add_argument("--lidx", type=int, dest="lidx", help="when using detailed comparison, the index to use within the left hand side list")
    parser.add_argument("--detail", action="store_true")
    parser.add_argument("--summary", action="store_true")

    args = parser.parse_args()

    left_recs = []
    if args.left:
        left_recs = read_all_records_from(args.left.read())

    right_recs = []
    if args.right:
        right_recs = read_all_records_from(args.right.read())

    if args.summary:
        if args.left:
            summary_of(left_recs)
            print "----"
        if args.right:
            summary_of(right_recs)

    if args.left and args.right and args.detail and args.lidx and args.ridx:
        data_comparison(left_recs[args.lidx], right_recs[args.ridx])
