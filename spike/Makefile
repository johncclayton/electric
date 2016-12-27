CXX=g++
RM=rm -f
CPPFLAGS=-g -I/usr/local/include/modbus -I../3rdparty/build/include/libusb-1.0 
LDFLAGS=-L/usr/local/lib  
#LDLIBS=-lusb-1.0 -lmodbus -l../3rdparty/build/lib/libusb-1.0.a
LDLIBS=-lusb-1.0 -lmodbus 

SRCS=read_test.cpp utils.cpp
OBJS=$(subst .cpp,.o,$(SRCS))

all: read_test

read_test: $(OBJS)
	$(CXX) $(LDFLAGS) -o read_test $(OBJS) $(LDLIBS)

depend: .depend

.depend: $(SRCS)
	rm -f ./.depend
	$(CXX) $(CPPFLAGS) -MM $^>>./.depend;

clean:
	$(RM) $(OBJS)

dist-clean:
	$(RM) ~* .depend

include .depend
