# provides a module namespace for variables that can affect testing / control flow


class TestingControlException(Exception):
    pass


class TestingControlValues(object):

    def __init__(self):
        self.usb_device_present = True
        self.modbus_read_should_fail = False
        self.modbus_write_should_fail = False
        self.bypass_caches = False
        self.reset()

    def reset(self):
        # Holds the global testing flags that modify the interface behaviour in simple ways to enable testing
        self.usb_device_present = True
        # If a read operation should fail and throw an exception
        self.modbus_read_should_fail = False
        # If a write operation should fail and throw an exception
        self.modbus_write_should_fail = False
        # Causes the cache values to be reset within the worker
        self.bypass_caches = False

    def __str__(self):
        return "USB: {0}, READ_FAIL: {1}, WRITE_FAIL: {2}, BYPASS_CACHES: {3}".format(
            self.usb_device_present, self.modbus_read_should_fail, self.modbus_write_should_fail,
            self.bypass_caches
        )

values = TestingControlValues()
