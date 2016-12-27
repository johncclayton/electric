#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>
#include <memory.h>

#include "utils.h"

#define ICHARGER_VENDOR_ID 0x0483
#define ICHARGER_PRODUCT_ID 0x5751

libusb_context* ctx = 0;

void display_channel_status(icharger_usb_ptr device, Channel ch) {
    struct channel_status status;
    memset(&status, 0, sizeof(status));

    int r = device->get_channel_status((int)ch, &status);
    if(r == 0) {
        printf("Channel Status: %d\r\n", ch);
        printf("timestamp      : %ld\r\n", status.timestamp.value);

        printf("output pwr     : %ld\r\n", status.output_power.value);
        printf("output current : %ld\r\n", status.output_current.svalue);

        printf("input voltage  : %ld\r\n", status.input_voltage.value);
        printf("output voltage : %ld\r\n", status.output_voltage.value);
        printf("output capacity: %ld\r\n", status.output_capacity.value);

        printf("internal temp  : %ld\r\n", status.temp_internal.value);
        printf("external temp  : %ld\r\n", status.temp_external.value);

        for(int i = 0; i < MAX_CELLS; ++i) {
            printf("%d: cell voltage   : %ld\r\n", i, status.cell_voltage[i]);
            printf("%d: cell balance   : %d\r\n", i, status.balance_status[i]);
            printf("%d: cell resistance: %ld\r\n", i, status.cell_resistance[i]);
        }

        printf("total resistance: %ld\r\n", status.total_resistance);
        printf("line resistance : %ld\r\n", status.line_internal_resistance);

        printf("cycle count     : %ld\r\n", status.cycle_count);
        printf("control status  : %ld\r\n", status.control_status);
        printf("run status      : %ld\r\n", status.run_status);
        printf("run error       : %ld\r\n", status.run_error);
        printf("dialog box id   : %ld\r\n", status.dialog_box_id);
    } else {
        printf("unable to fetch the status of channel 1\r\n");
    }
}

void display_stuff(icharger_usb_ptr device,
                   bool device_only = false,
                   bool channel1 = false,
                   bool channel2 = false,
                   bool sys_storage_flag = false)
{
    if(device_only) {
        struct device_only dev_only;
        memset(&dev_only, 0, sizeof(device_only));

        int r = device->get_device_only(&dev_only);
        if(r == 0) {
            printf("device id : %d\r\n", dev_only.device_id.value);
            printf("device dn : %12s\r\n", dev_only.device_sn);
            printf("sw_version: %d\r\n", dev_only.sw_version.value);
            printf("hw_version: %d\r\n", dev_only.hw_version.value);
            printf("sys length: %d\r\n", dev_only.system_length.value);
            printf("mem length: %d\r\n", dev_only.memory_length.value);
            printf("ch1 state : %d\r\n", dev_only.ch1_status.value);
            printf("ch2 state : %d\r\n", dev_only.ch2_status.value);

        } else {
            printf("got error code: %d\r\n", r);
        }
    }

    if(channel1)
        display_channel_status(device, CHANNEL_1);
    if(channel2)
        display_channel_status(device, CHANNEL_2);

    if(sys_storage_flag) {
        struct system_storage sys_storage;
        memset(&sys_storage, 0, sizeof(sys_storage));

        int r = device->get_system_storage(&sys_storage);
        if(r == 0) {
            printf("System Storage\r\n");
            printf("unit temp           : %d\r\n", sys_storage.temp_unit);
            printf("temp cut off        : %d\r\n", sys_storage.temp_cut_off);
            printf("temp fans on        : %d\r\n", sys_storage.temp_fans_on);
            printf("temp power reduce   : %d\r\n", sys_storage.temp_power_reduce);
            printf("fans off delay      : %d\r\n", sys_storage.fans_off_delay);
            printf("lcd_contrast        : %d\r\n", sys_storage.lcd_contrast);
            printf("backlight value     : %d\r\n", sys_storage.backlight_value);
            printf("calibration         : %d\r\n", sys_storage.calibration);
            printf("input source        : %d\r\n", sys_storage.input_source);

            printf("dc input low volt   : %d\r\n", sys_storage.dc_input_low_volt);
            printf("dc input over volt  : %d\r\n", sys_storage.dc_input_over_volt);
            printf("dc input curr limit : %d\r\n", sys_storage.dc_input_current_limit);

            printf("bat input low volt  : %d\r\n", sys_storage.batt_input_low_volt);
            printf("bat input over volt : %d\r\n", sys_storage.batt_input_over_volt);
            printf("bat input curr limit: %d\r\n", sys_storage.batt_input_current_limit);

            printf("regen enabled       : %d\r\n", sys_storage.regenerative_enable);
            printf("regen volt limit    : %d\r\n", sys_storage.regenerative_volt_limit);
            printf("regen curr limit    : %d\r\n", sys_storage.regenerative_current_limit);

            for(int i = 0; i < MODEL_MAX; ++i) {
                printf("%d: charger power   : %d\r\n", i, sys_storage.charger_power[i]);
                printf("%d: discharge powe  : %d\r\n", i, sys_storage.discharge_power[i]);
            }

            printf("power priority      : %d\r\n", sys_storage.power_priority);
            printf("logging sample rate : %d\r\n", sys_storage.logging_sample_interval);
            printf("logging save to sd  : %d\r\n", sys_storage.logging_save_to_sdcard);

            printf("servo type          : %d\r\n", sys_storage.servo_type);
            printf("servo user center   : %d\r\n", sys_storage.servo_user_center);
            printf("servo user rate     : %d\r\n", sys_storage.servo_user_rate);
            printf("servo user op angle : %d\r\n", sys_storage.servo_user_op_angle);

            printf("modbus model        : %d\r\n", sys_storage.modbus_model);
            printf("modbus serial addr  : %d\r\n", sys_storage.modbus_serial_addr);
            printf("modbus server baud  : %d\r\n", sys_storage.modbus_serial_baud_rate);
            printf("modbus serial parity: %d\r\n", sys_storage.modbus_serial_parity_bits);
        } else {
            printf("unable to fetch the system storage data\r\n");
        }
    }
}

int main(int argc, char *argv[]) {
	bool display_only = true;
	ProgramType pt = RUNOP_CHARGE;
	OrderAction oa = ORDER_STOP;
	Channel channel = CHANNEL_1;	
	int mem_idx = 0;

	for(int i = 0; i < argc; ++i) {
		if(strcmp(argv[i], "-op") == 0) {
			display_only = false;

			if(strcmp(argv[i+1], "charge") == 0)
				pt = RUNOP_CHARGE;
			if(strcmp(argv[i+1], "storage") == 0)
				pt = RUNOP_STORAGE;
			if(strcmp(argv[i+1], "discharge") == 0)
				pt = RUNOP_DISCHARGE;
			if(strcmp(argv[i+1], "balance") == 0)
				pt = RUNOP_BALANCE;
			if(strcmp(argv[i+1], "cycle") == 0)
				pt = RUNOP_CYCLE;
			
		}		

		if(strcmp(argv[i], "-channel") == 0) {
			if(atoi(argv[i + 1]) == 1)
				channel = CHANNEL_1;	
			if(atoi(argv[i + 1]) == 2)
				channel = CHANNEL_2;	
		}

		if(strcmp(argv[i], "-stop") == 0)
			oa = ORDER_STOP;
		if(strcmp(argv[i], "-start") == 0)
			oa = ORDER_RUN;
	}

	int r = libusb_init(&ctx);
	if(r != 0)
		error_exit("failed to init libusb", r);

	{
    		icharger_usb_ptr device = icharger_usb::first_charger(ctx, ICHARGER_VENDOR_ID, ICHARGER_PRODUCT_ID);
    		if(! device.get())
        		error_exit("cannot find an iCharger device", -1);
    
		libusb_set_debug(ctx, 4);

    		if(display_only) {
    		printf("displaying device info");
        		display_stuff(device, true);
    		} else {
			printf("command line: start/stop: %d, program: %d, channel: %d, mem index: %d\r\n",
				oa,
				pt,
				channel,
				mem_idx);

        		ModbusRequestError r = device->order(oa, channel, pt, mem_idx);
        		if(r != 0)
            			printf("failed to run command, exit code: %d / %x\r\n", r, r);
			else {
				printf("command executed ok\r\n");
			}	
    		}
	}
    
	libusb_exit(ctx);

	return 0;
}
