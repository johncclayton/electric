// system storage at 0x8400
typedef unsigned short u16;
typedef short s16;
#define MODEL_MAX 2

#include <iostream>

/*
INTRO:

The only reason I wrote this was to ensure i was using the right word offsets
for the SYSTEM storage structure within the Pyton code.  Easier for me to 
work it out this way .

*/

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

int distance(struct system_storage& obj, u16* ptr) {
	return ptr - (u16 *)&obj;
}

int main(int argc, char *argv[]) {
	printf("Offsets for structure entry points\r\n");

	system_storage s;

	printf("temp_unit       : %d\r\n", distance(s, &s.temp_unit));
	printf("temp_cut_off    : %d\r\n", distance(s, &s.temp_cut_off));
	printf("temp_fans_on    : %d\r\n", distance(s, &s.temp_fans_on));
	printf("temp_power_re   : %d\r\n", distance(s, &s.temp_power_reduce));
	printf("fans_off_delay  : %d\r\n", distance(s, &s.fans_off_delay));
	printf("beep-type       : %d\r\n", distance(s, &s.beep_type[0]));
	printf("beep-enabled    : %d\r\n", distance(s, &s.beep_enabled[0]));
	printf("beep-volume     : %d\r\n", distance(s, &s.beep_volume[0]));
	printf("calibration     : %d\r\n", distance(s, &s.calibration));
	printf("input_source    : %d\r\n", distance(s, &s.input_source));
	printf("batt inp low v  : %d\r\n", distance(s, &s.batt_input_low_volt));
	printf("regen_enable    : %d\r\n", distance(s, &s.regenerative_enable));
	printf("charger power   : %d\r\n", distance(s, &s.charger_power[0]));
	printf("power_priority  : %d\r\n", distance(s, &s.power_priority));
	printf("servo_type      : %d\r\n", distance(s, &s.servo_type));
	printf("modbus_model    : %d\r\n", distance(s, &s.modbus_model));

	return 0;
}

