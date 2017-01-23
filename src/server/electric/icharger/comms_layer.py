import logging
import modbus_tk.defines as cst

from electric.icharger.models import SystemStorage, WriteDataSegment
from modbus_usb import iChargerMaster
from models import DeviceInfo, ChannelStatus, Control, PresetIndex, Preset, ReadDataSegment

CHANNEL_INPUT_HEADER_OFFSET = 0
CHANNEL_INPUT_FOOTER_OFFSET = 51
CHANNEL_INPUT_CELL_IR_FORMAT = 35
CHANNEL_INPUT_CELL_BALANCE_OFFSET = 27
CHANNEL_INPUT_CELL_VOLT_OFFSET = 11

# see the helper/main.cpp module I created that tells me these
# offset values more reliably than Mr Blind Man.
SYSTEM_STORAGE_OFFSET_FANS_OFF_DELAY = 5
SYSTEM_STORAGE_OFFSET_CALIBRATION = 22
SYSTEM_STORAGE_OFFSET_CHARGER_POWER = 34

logger = logging.getLogger('electric.app.{0}'.format(__name__))


class ChargerCommsManager(object):
    """
    The comms manager is responsible for data translation between the MODBUS types and the world outside.  It uses an
    instance of the modbus capable read/write routines to fetch and modify charger parameters.  It co-ordinates
    multiple modbus segment reads/writes where required.

    Validation is not performed here - the data going in/out is assumed to be correct already.
    """
    locking = False

    def __init__(self, master=None):
        if master is None:
            master = iChargerMaster()
        self.charger = master

    def reset(self):
        self.charger.reset()

    def get_device_info(self):
        """
        Returns the following information from the iCharger, known as the 'device only reads message'
        :return: a DeviceInfo instance
        """
        vars = ReadDataSegment(self.charger, "vars", "h12sHHHHHH", base=0x0000)
        return DeviceInfo(vars.data)

    def get_channel_status(self, channel, device_id=None):
        """"
        Returns the following information from the iCharger, known as the 'channel input read only' message:
        :return: ChannelStatus instance
        """
        addr = 0x100 if channel == 0 else 0x200

        # timestamp -> ext temp
        header_fmt = "LlhHHlhh"
        header_data = self.charger.modbus_read_registers(addr, header_fmt)

        # cell 0-15 voltage
        cell_volt_fmt = "16H"
        cell_volt_addr = addr + CHANNEL_INPUT_CELL_VOLT_OFFSET
        cell_volt = self.charger.modbus_read_registers(cell_volt_addr, cell_volt_fmt)

        # cell 0-15 balance
        cell_balance_fmt = "16B"
        cell_balance_addr = addr + CHANNEL_INPUT_CELL_BALANCE_OFFSET
        cell_balance = self.charger.modbus_read_registers(cell_balance_addr, cell_balance_fmt)

        # cell 0-15 IR
        cell_ir_fmt = "16H"
        cell_ir_addr = addr + CHANNEL_INPUT_CELL_IR_FORMAT
        cell_ir = self.charger.modbus_read_registers(cell_ir_addr, cell_ir_fmt)

        # total IR -> dialog box ID
        footer_fmt = "7H"
        footer_addr = addr + CHANNEL_INPUT_FOOTER_OFFSET
        footer = self.charger.modbus_read_registers(footer_addr, footer_fmt)

        return ChannelStatus(device_id, channel, header_data, cell_volt, cell_balance, cell_ir, footer)

    def get_control_register(self):
        "Returns the current run state of a particular channel"
        return Control(self.charger.modbus_read_registers(0x8000, "7H", function_code=cst.READ_HOLDING_REGISTERS))

    def _beep_summary_dict(self, enabled, volume, type):
        return {
            "enabled": enabled,
            "volume": volume,
            "type": type
        }

    def set_beep_properties(self, beep_index=0, enabled=True, volume=5):
        # for now we only access beep type values
        base = 0x8400

        results = ReadDataSegment(self.charger, "temp", "8H", base=0x8400 + 13)
        value_enabled = list(results.data[:4])
        value_volume = list(results.data[4:])

        value_enabled[beep_index] = int(enabled)
        value_volume[beep_index] = volume

        return self.charger.modbus_write_registers(base + 13, value_enabled + value_volume)

    def set_active_channel(self, channel):
        base = 0x8000 + 2
        if channel not in (0, 1):
            return None
        return self.charger.modbus_write_registers(base, (channel,))

'''har har har



// DemoJunsiModBusHIDDlg.h : header file
//

#pragma once
#include "afxwin.h"

#include "dbt.h"
#include "usb.h"
#include <setupapi.h>
extern "C" {
#include "hidsdi.h"
}
#pragma comment(lib, "setupapi.lib")
#pragma comment(lib, "hid.lib")

// CDemoJunsiModBusHIDDlg dialog
class CDemoJunsiModBusHIDDlg : public CDialog
{
// Construction
public:
	CDemoJunsiModBusHIDDlg(CWnd* pParent = NULL);	// standard constructor

// Dialog Data
	enum { IDD = IDD_DEMOJUNSIMODBUSHID_DIALOG };

	protected:
	virtual void DoDataExchange(CDataExchange* pDX);	// DDX/DDV support


// Implementation
protected:
	HICON m_hIcon;

	// Generated message map functions
	virtual BOOL OnInitDialog();
	afx_msg void OnPaint();
	afx_msg HCURSOR OnQueryDragIcon();
	afx_msg BOOL OnDeviceChange(UINT nEventType, DWORD dwData);
	DECLARE_MESSAGE_MAP()
public:
	CListBox m_DeviceList;
	void FillDeviceList(void);
	void Enum(void);
	afx_msg void OnBnClickedOk();
	afx_msg void OnBnClickedButton1();
	afx_msg void OnBnClickedButton2();
	afx_msg void OnBnClickedButton3();
	afx_msg void OnBnClickedButton4();
	afx_msg void OnBnClickedButton5();
	afx_msg void OnBnClickedButton6();
	CComboBox mMemoryIndex;
	afx_msg void OnBnClickedButton7();
	afx_msg void OnBnClickedButton8();
	afx_msg void OnBnClickedButtonRun();
	CButton m_Receive;
	afx_msg void OnTimer(UINT_PTR nIDEvent);

public:
	void GetShowValue(CString *pStr,DWORD Value,WORD Len,WORD Dot);
	void ShowInf(void);
	CString txtTimeStamp;
	CString txtCell1;
	CString txtCell2;
	CString txtCell3;
	CString txtCell5;
	CString txtCell6;
	CString txtCell7;
	CString txtCell8;
	CString txtCell9;
	CString txtCell10;
	CString txtCell4;
	CString txtInput;
	CString txtOutput;
	CString txtCurrent;
	afx_msg void OnBnClickedButton10();
	afx_msg void OnBnClickedButton11();
};

#define JSHID_VENDORID	0x483
#define JSHID_PRODUCTID	0x5750
#define JSHID_MAX		8
typedef struct HID_INFO
{
	int Index;
	HIDD_ATTRIBUTES Attributes;
	USHORT Name[128];
	USHORT SerialNum[128];
}HidInfo;

typedef struct HID_ENUM
{
	int Count;
	HidInfo Info[JSHID_MAX];
}HidEnum;

#include "MemStruct.h"

#define REG_INPUT_INFO_START 0x0000
//#define REG_INPUT_INFO_NREGS

#define REG_INPUT_CH1_START 0x0100
#define REG_INPUT_CH1_NREGS 0x0100
#define REG_INPUT_CH2_START (0x0100+REG_INPUT_CH1_START)
#define REG_INPUT_CH2_NREGS REG_INPUT_CH1_NREGS

#define REG_HOLDING_CTRL_START 0x8000
#define REG_HOLDING_CTRL_NREGS 7

enum REG
{
	REG_SEL_OP = REG_HOLDING_CTRL_START,
	REG_SEL_MEM,
	REG_SEL_CHANNEL,
	REG_ORDER_KEY,
	REG_ORDER,
	REG_CURRENT,
	REG_VOLT
};

#define VALUE_ORDER_KEY		0x55aa
enum ORDER
{
	ORDER_STOP,	//Í£Ö¹ÔËÐÐ
	ORDER_RUN,	//ÔËÐÐ
	ORDER_MODIFY,	//ÔËÐÐÊ±¸ü¸Ä²ÎÊý
	ORDER_WRITE_SYS,//SYSTEMÊý¾Ý±£´æµ½flashÖÐ
	ORDER_WRITE_MEM_HEAD,
	ORDER_WRITE_MEM,//MEMORYÊý¾Ý±£´æµ½flashÖÐ
	ORDER_TRANS_LOG_ON,	//¿ªÆôLog´«Êä
	ORDER_TRANS_LOG_OFF,//¹Ø±ÕLog´«Êä
	ORDER_MSGBOX_YES, //¶Ô»°¿ò»ØÓ¦<YES>
	ORDER_MSGBOX_NO, //¶Ô»°¿ò»ØÓ¦<NO>
};

#define REG_HOLDING_SYS_START 0x8400
#define REG_HOLDING_SYS_NREGS ((sizeof(SYSTEM)+1)/2)

#define REG_HOLDING_MEM_HEAD_START 0x8800
#define REG_HOLDING_MEM_HEAD_NREGS ((sizeof(MEM_HEAD)+1)/2)

#define REG_HOLDING_MEM_START 0x8c00
#define REG_HOLDING_MEM_NREGS ((sizeof(MEMORY)+1)/2)

---------------------------------------- hack hac k hack... lol






   #pragma once
//#include "afxwin.h"

#define MB_HID_PROTOCOL_ID	0x30

//ModBus HID ADU pack
//Len(1byte)+Type(1byte)+ModBus PDU
//Type=MB_HID_PROTOCOL_ID 0x30
#define HID_PACK_MAX	64
#define HID_PACK_CH		0
#define HID_PACK_LEN	1
#define HID_PACK_TYPE	2
#define HID_PACK_MODBUS	3
#define REPORT_ID		0

typedef enum
{
	MB_EOK = 0x00,				/*!< no error. */
    MB_EX_ILLEGAL_FUNCTION = 0x01,
    MB_EX_ILLEGAL_DATA_ADDRESS = 0x02,
    MB_EX_ILLEGAL_DATA_VALUE = 0x03,
    MB_EX_SLAVE_DEVICE_FAILURE = 0x04,
    MB_EX_ACKNOWLEDGE = 0x05,
    MB_EX_SLAVE_BUSY = 0x06,
    MB_EX_MEMORY_PARITY_ERROR = 0x08,
    MB_EX_GATEWAY_PATH_FAILED = 0x0A,
    MB_EX_GATEWAY_TGT_FAILED = 0x0B,
    MB_ENOREG = 0x80,           /*!< illegal register address. */
	MB_EILLFUNCTION,			/*!< illegal function code. */
    MB_EIO,                     /*!< I/O error. */
    MB_ERETURN,					/*!< protocol stack in illegal state. */
	MB_ELEN,					/*!< pack len larg error. */
    MB_ETIMEDOUT                /*!< timeout error occurred. */
}eMBErrorCode;

/* ----------------------- Defines ------------------------------------------*/
#define MB_FUNC_NONE                          (  0 )
#define MB_FUNC_READ_COILS                    (  1 )
#define MB_FUNC_READ_DISCRETE_INPUTS          (  2 )
#define MB_FUNC_WRITE_SINGLE_COIL             (  5 )
#define MB_FUNC_WRITE_MULTIPLE_COILS          ( 15 )
#define MB_FUNC_READ_HOLDING_REGISTER         (  3 )
#define MB_FUNC_READ_INPUT_REGISTER           (  4 )
#define MB_FUNC_WRITE_REGISTER                (  6 )
#define MB_FUNC_WRITE_MULTIPLE_REGISTERS      ( 16 )
#define MB_FUNC_READWRITE_MULTIPLE_REGISTERS  ( 23 )
#define MB_FUNC_DIAG_READ_EXCEPTION           (  7 )
#define MB_FUNC_DIAG_DIAGNOSTIC               (  8 )
#define MB_FUNC_DIAG_GET_COM_EVENT_CNT        ( 11 )
#define MB_FUNC_DIAG_GET_COM_EVENT_LOG        ( 12 )
#define MB_FUNC_OTHER_REPORT_SLAVEID          ( 17 )
#define MB_FUNC_ERROR                         ( 128 )

eMBErrorCode MasterModBus(BYTE FunCode,BYTE *pIn,BYTE *pOut,DWORD ms);
eMBErrorCode MasterRead(BYTE ReadType,DWORD RegStart,DWORD RegCount,BYTE *pOut);
eMBErrorCode MasterWrite(DWORD RegStart,DWORD RegCount,BYTE *pIn);



    def run_operation(self, the_op):

        channel_status = self.get_channel_status(channel_id)
        status = self.get_device_info()

        values = (
            CONSTANT_CHARGE,
            memory_index,
            channel_id
        )

        ret_values = self.charger.modbus_write_registers(0x8000, values)

        # clear the ORDER LOCK value (no idea why - the C++ code does this)
        self.charger.modbus_write_registers(0x8000 + 3, (0, ))


    for reference

       ModbusRequestError icharger_usb::order(OrderAction action, Channel ch, ProgramType program, int mem_index) {
            u16 data[5];

            switch(action) {
            case ORDER_RUN:
                data[0] = program;
                data[1] = mem_index;
                data[2] = (int)ch;
                data[3] = VALUE_ORDER_KEY; // 0x55aa
                data[4] = action;
                return write_request(REG_SEL_OP, 5, (char *)data);

            case ORDER_STOP:
                data[0] = VALUE_ORDER_KEY;
                data[1] = action;
                return write_request(REG_ORDER_KEY, 2, (char *)data);
            }

            return MB_EILLFUNCTION;
        }
    '''

    def get_system_storage(self):
        """Returns the system storage area of the iCharger"""
        # temp-unit -> beep-vol
        ds1 = ReadDataSegment(self.charger, "vars1", "21H", base=0x8400)
        # dump3 -> reg current limit
        ds2 = ReadDataSegment(self.charger, "vars2", "13H", prev_format=ds1)
        # charge/discharge power -> modbus_serial_parity
        ds3 = ReadDataSegment(self.charger, "vars3", "17H", prev_format=ds2)

        return SystemStorage(ds1, ds2, ds3)

    def _get_memory_program_preset_index(self, index):
        preset_list = self.get_preset_list()
        if index > preset_list.count - 1:
            raise ValueError("Preset index too large")
        return preset_list.indexes[index]

    def select_memory_program(self, preset_index):
        control = self.get_control_register()
        return self.charger.modbus_write_registers(0x8000 + 1,
                                                   (preset_index, control.channel, 0x55aa))

    def get_preset_list(self, count_only=False):
        (count,) = self.charger.modbus_read_registers(0x8800, "H", function_code=cst.READ_HOLDING_REGISTERS)
        if count_only:
            return count

        number = count
        offset = 0
        indexes = ()

        while count > 0:
            to_read = min(count, 32)
            if (to_read % 2) != 0:
                to_read += 1
            data = self.charger.modbus_read_registers(0x8801 + offset, "{0}B".format(to_read),
                                                      function_code=cst.READ_HOLDING_REGISTERS)
            count -= len(data)
            indexes += data
            offset += len(data) / 2

        return PresetIndex(number, indexes[:number])

    def get_preset(self, index):
        preset_index = self._get_memory_program_preset_index(index)
        self.select_memory_program(preset_index)

        # use-flag -> channel mode
        vars1 = ReadDataSegment(self.charger, "vars1", "H38sLBB7cHB", base=0x8c00)
        # save to sd -> bal-set-point
        vars2 = ReadDataSegment(self.charger, "vars2", "BHH12BHBBB", prev_format=vars1)
        # bal-delay, keep-charge-enable -> reg discharge mode
        vars3 = ReadDataSegment(self.charger, "vars3", "BB14H", prev_format=vars2)
        # ni-peak -> cycle-delay
        vars4 = ReadDataSegment(self.charger, "vars4", "16H", prev_format=vars3)
        # cycle-mode -> ni-zn-cell
        vars5 = ReadDataSegment(self.charger, "vars5", "B6HB2HB3HB", prev_format=vars4)

        return Preset(index, vars1, vars2, vars3, vars4, vars5)

    def set_preset(self, preset):
        preset_index = self._get_memory_program_preset_index(preset.index)
        self.select_memory_program(preset_index)

        # ask the preset for its data segments
        (v1, v2, v3, v4, v5) = preset.to_modbus_data()

        s1 = WriteDataSegment(self.charger, "seg1", v1, base=0x8c00)
        s2 = WriteDataSegment(self.charger, "seg2", v2, prev_format=s1)
        s3 = WriteDataSegment(self.charger, "seg3", v3, prev_format=s2)
        s4 = WriteDataSegment(self.charger, "seg3", v4, prev_format=s3)
        s5 = WriteDataSegment(self.charger, "seg3", v5, prev_format=s4)

        return True
