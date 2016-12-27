#include <stdarg.h>
#include <memory.h>
#include <stdio.h>
#include <stdlib.h>

#include "utils.h"

#define END_POINT_ADDRESS_WRITE 0x01
#define END_POINT_ADDRESS_READ 0x81

#define READ_REG_COUNT_MAX 30
#define WRITE_REG_COUNT_MAX 28 

#define MB_FUNC_READ_INPUT_REGISTER 0x04
#define MB_FUNC_READ_HOLDING_REGISTER 0x03
#define MB_FUNC_WRITE_MULTIPLE_REGISTERS 0x10

#define BASE_ADDR_DEVICE_ONLY 0x0000
#define BASE_ADDR_CHANNEL_STATUS1 0x0100
#define BASE_ADDR_CHANNEL_STATUS2 0x0200
#define BASE_ADDR_SYSTEM_STORAGE 0x8400

#define HID_PACK_MAX		64
#define HID_PACK_LEN		0
#define HID_PACK_TYPE		1
#define HID_PACK_MODBUS		2

void error_exit(const char* msg, int rc, ...) {
    char buffer[2048];
    memset(buffer, 0, sizeof(buffer));
    
    va_list args;
    va_start(args, rc);
    vsprintf(buffer, msg, args);
    va_end(args);
    
    printf("%s, %d/%s\r\n", buffer, rc, libusb_error_name(rc));
    
    exit(1);
}

icharger_usb::icharger_usb(libusb_device* d) : 
    device(d),
    handle(0),
    timeout_ms(1000)
{
    int r = libusb_open(device, &handle);
    handle && r == 0; 
}

icharger_usb::~icharger_usb() {
    if(handle)
        libusb_close(handle);
    handle = 0;
}

int icharger_usb::acquire() {
    int r = libusb_kernel_driver_active(handle, 0);
    if(r == 1) {
        int r = libusb_detach_kernel_driver(handle, 0);
        if(r != 0)
            return r;
    }
    
    int configuration = 0;
    r = libusb_get_configuration(handle, &configuration);
    if(r != 0) {
        printf("cannot obtain the current configuration: %d\r\n", r);
        return r;
    }
        
    r = libusb_claim_interface(handle, 0);
    if(r < 0)
        return r;
    
    // find the right interface, it's the non-SD card one...a HID type.
//    struct libusb_config_descriptor * config = 0;
//    r = libusb_get_active_config_descriptor(device, &config);
//    if(r != 0) {
//        error_exit("cannot obtain the current configuration description", r);
//    }
//    libusb_free_config_descriptor(config);

    return 0;    
}

void dump_ascii_hex(const char *msg, char* data, int len) {
    printf("%s - from addr: %xd for %d bytes\r\n", msg, data, len);
    for(int i = 0; i < len; ++i) {
        printf("%2d: %2x %d %c\r\n", i, data[i], data[i], data[i]);
    }

    printf("----\r\n");
}

/* same as the library version, but automatically handles retry on timeout */
int icharger_usb::usb_data_transfer(unsigned char endpoint_address,
                                    char* data,
                                    int length,
                                    int* total_transferred)
{
    int r = 0;
    
    int temp_total = 0;
    if(!total_transferred)
        total_transferred = &temp_total;
    
    int bytes_transferred = 0;
        
    while(1) {
        int transferred = 0;
        
        r = libusb_interrupt_transfer(
                    handle,
                    endpoint_address,
                    (unsigned char *)data + bytes_transferred,
                    length - bytes_transferred,
                    &transferred,
                    timeout_ms);
        
        *total_transferred += transferred;
        bytes_transferred += transferred;
        
        if(r == LIBUSB_ERROR_TIMEOUT) {
            //printf("retrying...\r\n");
        } else if(r != 0) {
            error_exit("an error was encountered during data transfer", r);
        }
        
        if(*total_transferred >= length)
            return 0;
    }
}

ModbusRequestError icharger_usb::modbus_request(char func_code, char* input, char *output) {
    char data [HID_PACK_MAX+1];
    memset(data, 0, sizeof(data));
    
    data[HID_PACK_TYPE] = 0x30;
    data[HID_PACK_MODBUS] = func_code;
    
    switch(func_code) {
    case MB_FUNC_READ_INPUT_REGISTER:
    case MB_FUNC_READ_HOLDING_REGISTER:
        data[HID_PACK_LEN] = 7;
        break;
        
    case MB_FUNC_WRITE_MULTIPLE_REGISTERS:
        data[HID_PACK_LEN] = 7 + input[4] + 1;
        if(data[HID_PACK_LEN] > HID_PACK_MAX)
            return MB_ELEN;
        break;
    }
    
    for(int i = 0; i < data[HID_PACK_LEN] - 3; i++)
        data[HID_PACK_MODBUS + 1 + i] = input[i];

    // ask the iCharger to send back the registers
    dump_ascii_hex("sending request", data, 7);
    int r = usb_data_transfer(END_POINT_ADDRESS_WRITE, data, HID_PACK_MAX);
    if(r == 0) {
        memset(data, 0, sizeof(data));     
        r = usb_data_transfer(END_POINT_ADDRESS_READ, (char *)&data, HID_PACK_MAX);
        
        if(r == 0) {
            if(data[HID_PACK_LEN] > HID_PACK_MAX) {
                return MB_ELEN;
            }
            
            dump_ascii_hex("read reply data", data, data[HID_PACK_LEN]);
            
            if(data[HID_PACK_MODBUS] == func_code) {
                switch(func_code) {
                case MB_FUNC_READ_INPUT_REGISTER:
                case MB_FUNC_READ_HOLDING_REGISTER:
                    if((data[HID_PACK_LEN] != data[HID_PACK_MODBUS + 1] + 4) || (data[HID_PACK_LEN] & 0x01)) {
                        return MB_ELEN;
                    }
                    
                    // primitive byte swap.
                    for(int i = 0; i < data[HID_PACK_MODBUS + 1]; i += 2) {
                        output[i] = data[HID_PACK_MODBUS+2+i+1];
                        output[i + 1] = data[HID_PACK_MODBUS+2+i];
                    }
                    
                    break;
                case MB_FUNC_WRITE_MULTIPLE_REGISTERS:
                    data[HID_PACK_LEN] = 5 + (data[HID_PACK_MODBUS + 5] * 2 + 1);	
                    break;
                }
            } else {
                if(data[HID_PACK_MODBUS] == (func_code | 0x80))
                    return (ModbusRequestError) data[HID_PACK_MODBUS + 1];	
                else
                    return MB_ERETURN;
            }
        } else {
            // failed to read for some reason, need to log and massage to request error
            printf("failed to read data from usb, %d/%s\r\n", r, libusb_error_name(r));
            return MB_EIO;
        }
    } else {
        // failed to read for some reason, need to log and massage to request error
        printf("failed to write data to usb, %d/%s\r\n", r, libusb_error_name(r));
        return MB_EIO;
    }
    
    return MB_EOK;
}

ModbusRequestError icharger_usb::read_request(char func_code, int base_addr, int num_registers, char* dest) {
    ModbusRequestError r = MB_EOK;
    
    //printf("read request from base_addr: %x, for %d registers, sizeof read_req: %d\r\n", base_addr, num_registers, sizeof(read_data_registers));
    
    for(int i = 0; i < num_registers / READ_REG_COUNT_MAX; ++i) {
        read_data_registers read_req(base_addr, READ_REG_COUNT_MAX);
        r = modbus_request(func_code, (char *)&read_req, dest);
        if(r != MB_EOK)
            return r;
        
        base_addr += READ_REG_COUNT_MAX;
        dest += (READ_REG_COUNT_MAX * 2);
    }
    
    if(num_registers % READ_REG_COUNT_MAX) {
        read_data_registers read_req(base_addr, num_registers);
        read_req.quantity_to_read.high = 0;
        read_req.quantity_to_read.low = num_registers % READ_REG_COUNT_MAX;
               
        r = modbus_request(func_code, (char *)&read_req, dest);
        if(r != MB_EOK)
            return r;
    }
    
    return r;
}

ModbusRequestError icharger_usb::write_request(int base_addr, int num_registers, char *input) {
    ModbusRequestError r = MB_EOK;
    
    char data[80];
    memset(data, 0, sizeof(data));
    
    for(int i = 0; i < num_registers / WRITE_REG_COUNT_MAX; i++) {
        data[0] = (base_addr >> 8);
        data[1] = (base_addr & 0xff);
        data[2] = 0;
        data[3] = WRITE_REG_COUNT_MAX;
        data[4] = 2 * WRITE_REG_COUNT_MAX;
        
        for(int j = 0; j < data[4]; j += 2) {
            data[5+j] = input[j + 1];
            data[5+j+1] = input[j];
        }
        
        r = modbus_request(MB_FUNC_WRITE_MULTIPLE_REGISTERS, data, NULL);
        if(r != MB_EOK)
            return r;
        
        base_addr += WRITE_REG_COUNT_MAX;
        input += (2 * WRITE_REG_COUNT_MAX);
    }
    
    if(num_registers % WRITE_REG_COUNT_MAX)
    {
        data[0] = (base_addr >> 8);
        data[1] = (base_addr & 0xff);
        data[2] = 0;
        data[3] = num_registers % WRITE_REG_COUNT_MAX;
        data[4] = 2 * data[3];
        
        for(int j = 0; j < data[4]; j += 2) {
            data[5+j] = input[j+1];
            data[5+j+1] = input[j];
        }
        
        r = modbus_request(MB_FUNC_WRITE_MULTIPLE_REGISTERS, data, NULL);
        if(r != MB_EOK)
            return r;
    }
    
    return r;
}

// 0x04 - read input registers at base address 0x0000
ModbusRequestError icharger_usb::get_device_only(device_only* output) {	
    return read_request(MB_FUNC_READ_INPUT_REGISTER, BASE_ADDR_DEVICE_ONLY, sizeof(device_only) / 2, (char *)output); 
}

ModbusRequestError icharger_usb::get_channel_status(int channel /* 0 or 1 */, channel_status* output) {
    int addr = 0;
    
    if(channel == 0)
        addr = BASE_ADDR_CHANNEL_STATUS1;
    else
        addr = BASE_ADDR_CHANNEL_STATUS2;
    
    if(addr)
        return read_request(MB_FUNC_READ_INPUT_REGISTER, addr, sizeof(channel_status) / 2, (char *)output);
    
    return MB_EX_ILLEGAL_DATA_ADDRESS;
}

ModbusRequestError icharger_usb::get_system_storage(system_storage* output) {
    device_only dev;
    ModbusRequestError r = get_device_only(&dev);
    if(r == MB_EOK) {
        return read_request(MB_FUNC_READ_HOLDING_REGISTER, BASE_ADDR_SYSTEM_STORAGE, 
                            sizeof(system_storage) / 2, (char *)output);
    }
    
    return MB_EX_ILLEGAL_DATA_ADDRESS;	
}

ModbusRequestError icharger_usb::order(OrderAction action, Channel ch, ProgramType program, int mem_index) {
	u16 data[5];

	switch(action) {
	case ORDER_RUN:
		data[0] = program;
		data[1] = mem_index;
		data[2] = (int)ch;
		data[3] = VALUE_ORDER_KEY; 
		data[4] = action;
		return write_request(REG_SEL_OP, 5, (char *)data);
        
	case ORDER_STOP:
		data[0] = VALUE_ORDER_KEY;
		data[1] = action;	
		return write_request(REG_ORDER_KEY, 2, (char *)data);
	}

	return MB_EILLFUNCTION;
}

icharger_usb_ptr icharger_usb::first_charger(libusb_context* ctx, int vendor, int product) {
    libusb_device **devs;
    size_t cnt = libusb_get_device_list(ctx, &devs);
    
    libusb_device* found = 0;
    
    for(size_t index = 0; index < cnt && !found; ++index) {
        struct libusb_device_descriptor desc;
        int r = libusb_get_device_descriptor(devs[index], &desc);
        if (r >= 0) {
            if(desc.idVendor == vendor && desc.idProduct == product) {
                found = devs[index];
            }
        }
    }
    
    icharger_usb_ptr p;
    if(found) {
        p = icharger_usb_ptr(new icharger_usb(found));
	if(p->acquire())
		p = icharger_usb_ptr();
    }
    
    libusb_free_device_list(devs, 1 /* unref all elements */);
    
    return p;
}
