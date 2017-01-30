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
