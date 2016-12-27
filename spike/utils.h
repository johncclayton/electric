
#ifndef __iCharger_USB_H
#define __iCharger_USB_H

#include <libusb.h>
#include <memory>

void error_exit(const char* msg, int rc, ...);

struct icharger_usb;
typedef std::auto_ptr<icharger_usb> icharger_usb_ptr;

#define MAX_CELLS           16
#define LIST_MEM_MAX        64
#define MODEL_MAX           2

#define VALUE_ORDER_KEY	0x55aa

enum ProgramType {
	RUNOP_CHARGE,
	RUNOP_STORAGE,
	RUNOP_DISCHARGE,
	RUNOP_CYCLE,
	RUNOP_BALANCE
};

enum OrderAction
{
	ORDER_STOP=0,	
	ORDER_RUN,
	ORDER_MODIFY,	
	ORDER_WRITE_SYS,
	ORDER_WRITE_MEM_HEAD,
	ORDER_WRITE_MEM,
	ORDER_TRANS_LOG_ON,
	ORDER_TRANS_LOG_OFF,
	ORDER_MSGBOX_YES, 
	ORDER_MSGBOX_NO, 
};

enum ModbusRequestError
{
    MB_EOK = 0x00,                      /*!< no error. */
    MB_EX_ILLEGAL_FUNCTION = 0x01,
    MB_EX_ILLEGAL_DATA_ADDRESS = 0x02,
    MB_EX_ILLEGAL_DATA_VALUE = 0x03,
    MB_EX_SLAVE_DEVICE_FAILURE = 0x04,
    MB_EX_ACKNOWLEDGE = 0x05,
    MB_EX_SLAVE_BUSY = 0x06,
    MB_EX_MEMORY_PARITY_ERROR = 0x08,
    MB_EX_GATEWAY_PATH_FAILED = 0x0A,
    MB_EX_GATEWAY_TGT_FAILED = 0x0B,
    MB_ENOREG = 0x80,  			        /*!< illegal register address. */
    MB_EILLFUNCTION,                    /*!< illegal function code. */
    MB_EIO,                     		/*!< I/O error. */
    MB_ERETURN,                         /*!< protocol stack in illegal state. */
    MB_ELEN,                            /*!< pack len larg error. */
    MB_ETIMEDOUT                		/*!< timeout error occurred. */
};

#define REG_HOLDING_CTRL_START 0x8000
#define REG_HOLDING_CTRL_NREGS 7

enum RegistrySelectionOp
{
	REG_SEL_OP = REG_HOLDING_CTRL_START,
	REG_SEL_MEM,	
	REG_SEL_CHANNEL,		
	REG_ORDER_KEY,
	REG_ORDER,	
	REG_CURRENT,
	REG_VOLT
};

typedef unsigned long   u32;
typedef signed long     s32;
typedef unsigned short  u16;
typedef signed short    s16;
typedef unsigned char   u8;
typedef signed char     s8;

union register16 {
    union {
        u16 value;
        s16 svalue;
    };
    
    struct {
        u8 high;
        u8 low;
    } __attribute__ ((packed));
} __attribute__ ((packed));

union register32 {	
    union {
        u32 value;	
        s32 svalue;
    };
    
    struct {
        register16 high;
        register16 low;
    } __attribute__ ((packed));
} __attribute__ ((packed));	

// available at base address: 0x0000
struct device_only {
    register16   device_id;
    s8           device_sn[12];
    register16   sw_version;
    register16   hw_version;
    register16   system_length;
    register16   memory_length;
    register16   ch1_status;
    register16   ch2_status;
} __attribute__ ((packed));

// available at 0x0100 and 0x0200 (ch1 and ch2)
struct channel_status {
    register32 timestamp;
    register32 output_power;
    register16 output_current;
    register16 input_voltage;
    register16 output_voltage;
    register32 output_capacity;
    
    register16 temp_internal;
    register16 temp_external;
    
    u16 cell_voltage[MAX_CELLS];
    u8 balance_status[MAX_CELLS];
    u16 cell_resistance[MAX_CELLS];
    u16 total_resistance;
    
    u16 line_internal_resistance;
    u16 cycle_count;	
    u16 control_status;
    u16 run_status;
    u16 run_error;
    u16 dialog_box_id;
} __attribute__ ((packed));

// system storage at 0x8400
struct system_storage {
    u16 temp_unit;                  // P1_1, 0 celcius, 1: fahrenheit
    u16 temp_cut_off;               // P1_2, 60.0 - 75.0 default 75.0
    u16 temp_fans_on;               // P1_4, 30.0 - 50.0 default 40.0
    u16 temp_power_reduce;          // P1_3, 5.0 - 20.0 default 10.0
    u16 reserved_1;
    u16 fans_off_delay;             // P1_5
    u16 lcd_contrast;               // P2_1
    u16 backlight_value;            // P2_2
    u16 reserved_2;
    u16 beep_type[4];               // long, short, continuous P3_3
    u16 beep_enabled[4];            // same shit?  P3_1
    u16 beep_volume[4];         	// P3_2
    u16 reserved_3;
    u16 calibration;                // P4_1 - whatever this means?
    u16 reserved_4;
    u16 input_source;               // 0:dc, 1:bat P5_1
    u16 dc_input_low_volt;          // DC input low voltage protection P6_1
    u16 dc_input_over_volt;         // 
    u16 dc_input_current_limit; 	// DC input current max P6_2
    u16 batt_input_low_volt;        // BATT input low volt protection P7_1
    u16 batt_input_over_volt;       // 
    s16 batt_input_current_limit;	// input current max limit P7_2
    u16 regenerative_enable;        // P7_3
    u16 regenerative_volt_limit;	// P7_4
    s16 regenerative_current_limit;	// P7_5
    u16 charger_power[MODEL_MAX];	// P8_1 and P8_3
    u16 discharge_power[MODEL_MAX]; // P8_2 and P8_4
    u16 power_priority;
    u16 logging_sample_interval;	// P9_1
    u16 logging_save_to_sdcard;     // 0:no output, 1: output to SD log P9_2
    
    u16 servo_type;                 // P10_1
    u16 servo_user_center;          // servo pulse center P10_2
    u16 servo_user_rate;            // servo frame refresh rate P10_3
    u16 servo_user_op_angle;        // 45 deg. pulse width P10_4
    
    u16 modbus_model;               // P11_1 - presume USB or serial?
    u16 modbus_serial_addr;         // serial comms address P11_4
    u16 modbus_serial_baud_rate;	// serial comms baud rate P11_2
    u16 modbus_serial_parity_bits;	// serial comms parity P11_3
    
    u16 reserved_end[8];
};

struct memory_header {
    u16 Count;                  //0—LIST_MEM_MAX
    u8 Index[LIST_MEM_MAX]; 	//0xff-- empty 0xfe--hidden 0-LIST_MEM_MAX 
};

struct control_register {
    u16 operation;
    u16 select_memory;  // values 0-63
    u16 select_channel; // 0 or 1
    u16 order_lock;     // 0x55aa unlocks
    u16 order;          // see also enum ORDER
    u16 limit_current;
    u16 limit_voltage;
};

#define MEM_HEAD_DEFAULT {7,{0,1,2,3,4,5,6}}

struct read_data_registers {
    register16 starting_address;
    register16 quantity_to_read;
    
    read_data_registers(int base_addr, int num_registers) {
        starting_address.high = base_addr >> 8;
        starting_address.low = (char)(base_addr & 0xff);
        quantity_to_read.high = num_registers >> 8;
        quantity_to_read.low = (char)(num_registers & 0xff);
    }
} __attribute__ ((packed));

enum Channel {
	CHANNEL_1,
	CHANNEL_2
};

struct icharger_usb {
    icharger_usb(libusb_device* d);
    ~icharger_usb();
   
    int acquire();
 
    ModbusRequestError get_device_only(device_only* output);	
    ModbusRequestError get_channel_status(int channel /* 0 or 1 */, channel_status* output);
    ModbusRequestError get_system_storage(system_storage* output);
    ModbusRequestError order(OrderAction action, Channel ch, ProgramType pt, int selected_mem_index);
    
    static icharger_usb_ptr first_charger(libusb_context* ctx, int vendor, int product);
    
private:
    libusb_device* device;
    libusb_device_handle* handle;
    int timeout_ms;
    
    int usb_data_transfer(unsigned char endpoint_address,
                          char* data,
                          int length,
                          int* total_transferred = 0);
    
    ModbusRequestError modbus_request(char func_code, char* input, char *output);
    ModbusRequestError read_request(char func_code, int base_addr, int num_registers, char* dest);
    ModbusRequestError write_request(int base_addr, int num_registers, char* dest);
};

#endif

