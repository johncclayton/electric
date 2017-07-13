#include "stdafx.h"
#include <shlobj.h>
#include "MasterModBus.h"
#include "usb.h"
#include "Winsock2.h"

CUSBDevice JsHID;
CString log_prefix;

#define READ_REG_COUNT_MAX		((HID_PACK_MAX-4)/2) //30
#define WRITE_REG_COUNT_MAX		((HID_PACK_MAX-8)/2) //28
#define TIME_OUT	500

void NetWriteDesc(const char *desc) {
	// no-op
}

void NetWrite(CFile& output, DWORD value, const char *desc) {
	NetWriteDesc(desc);
	DWORD n = htonl(value);
	output.Write(&n, sizeof(n));
}

void NetWrite(CFile& output, const CString& value, const char *desc) {
	NetWriteDesc(desc);
	DWORD l = value.GetLength();
	NetWrite(output, l, "str_len");
	output.Write((LPCSTR)value, l);
}

void NetWrite(CFile& output, const char* value, int len, const char *desc) {
	NetWriteDesc(desc);
	output.Write(value, len);
}

void NetWrite(CFile& output, LPVOID data, int len, const char *desc) {
	NetWrite(output, len, "data_len");
	NetWrite(output, (const char*)data, len, "data");
}

void NetWrite(CFile& output, const CTime& value, const char *desc) {
	struct tm t1;
	value.GetGmtTm(&t1);
	char* gmt_timestr = asctime(&t1);
	DWORD len = strlen(gmt_timestr);
	NetWrite(output, len, "time_len");
	NetWrite(output, gmt_timestr, len, "time_value");
}

struct LogRecord {
	enum Operation {
		READ, 
		WRITE
	};

	CTime _time;
	Operation _op;
	CString _info;
	BYTE* _data;
	DWORD _data_len;
	DWORD _ms;
	BOOL _result;

	LogRecord(Operation op, CString& info, LPVOID data = 0, DWORD len = 0, DWORD ms = 0, BOOL res = FALSE) : _op(op), _info(info), _data(0), _ms(ms), _result(res) {
		_time = CTime::GetCurrentTime();
		if (data) {
			_data = new BYTE[len];
			_data_len = len;
			memcpy(_data, data, len);
		}
	}

	LogRecord(Operation op, CString& info, const BYTE* data = 0, DWORD len = 0, BOOL res = FALSE) : _op(op), _info(info), _data(0), _ms(0), _result(res) {
		_time = CTime::GetCurrentTime();
		if (data) {
			_data = new BYTE[len];
			_data_len = len;
			memcpy(_data, data, len);
		}
	}

	~LogRecord() {
		if (_data) {
			delete[] _data;
			_data = 0;
			_data_len = 0;
		}
	}

	void LogRecord::WriteTo(CFile& output) {
		NetWrite(output, _time, "timestamp");
		NetWrite(output, _op, "op");
		NetWrite(output, _info, "info");
		NetWrite(output, _data, _data_len, "data");
		NetWrite(output, _ms, "ms");
		NetWrite(output, (DWORD)_result, "result");
	}

	int operator<(const LogRecord& other) {
		return _time < other._time;
	}

	bool operator==(const LogRecord& other) {
		return _time == other._time;
	}
};

CArray<LogRecord*> log_record;

void WriteFileHeader(CFile& output) {
	// write number of elements
	NetWrite(output, log_record.GetSize(), "size");
}

void WriteFileTrailer(CFile& output) {
}

void DumpLogRecords() {
	CFile fileO;

	CHAR path[MAX_PATH + 1];
	memset(path, 0, sizeof(path));

	if (SHGetFolderPathA(NULL, CSIDL_DESKTOPDIRECTORY, NULL, 0, path) == S_OK) {
		strcat(path, "\\icharger");
		CreateDirectory(path, NULL);
		strcat(path, "\\");
		// current date/time as str appended to the log file
		CTime now = CTime::GetCurrentTime();
		strcat(path, (LPCTSTR)now.Format(_T("%Y-%m-%d_%H-%M-%S-junsi-win32.dat")));

		if (fileO.Open(path, CFile::modeCreate | CFile::modeWrite | CFile::typeBinary)) {
			WriteFileHeader(fileO);

			for (int index = 0; index < log_record.GetSize(); ++index) {
				// TODO: write the LogRecord to the CFile
				log_record[index]->WriteTo(fileO);
			}

			WriteFileTrailer(fileO);

			fileO.Close();
		} else {
			// TODO: report fileO.Open() failure
		}
	}
}

MasterLog::MasterLog(const char* prefix) {
	log_prefix = CString(prefix);
}

MasterLog::~MasterLog() {
	log_prefix = CString();
}

BOOL LoggedWrite(const BYTE* bytes, int bufLen) {
	BOOL result = JsHID.Write(bytes, bufLen);
	log_record.Add(new LogRecord(LogRecord::WRITE, log_prefix, bytes, bufLen, result));
	return result;
}

BOOL LoggedRead(LPVOID bytes, DWORD bufLen, DWORD ms) {
	BOOL result = JsHID.Read(bytes, bufLen, ms);
	log_record.Add(new LogRecord(LogRecord::READ, log_prefix, bytes, bufLen, ms, result));
	return result;
}

eMBErrorCode MasterRead(BYTE ReadType,DWORD RegStart,DWORD RegCount,BYTE *pOut)
{
	eMBErrorCode ret;
	DWORD i;
	BYTE InBuf[16];
	BYTE FunCode;
	//·¶Î§¼ì²é
	if(ReadType==0)
		FunCode = MB_FUNC_READ_HOLDING_REGISTER;
	else
		FunCode = MB_FUNC_READ_INPUT_REGISTER;

	for(i=0;i<RegCount/READ_REG_COUNT_MAX;i++)
	{
		InBuf[0] = (BYTE)(RegStart >> 8);
		InBuf[1] = (BYTE)(RegStart & 0xff);
		InBuf[2] = 0;
		InBuf[3] = READ_REG_COUNT_MAX;
		ret = MasterModBus(FunCode,InBuf,pOut,TIME_OUT);
		if(ret != MB_EOK)return ret;
		RegStart += READ_REG_COUNT_MAX;
		pOut += (2*READ_REG_COUNT_MAX);
	}

	if(RegCount%READ_REG_COUNT_MAX)
	{
		InBuf[0] = (BYTE)(RegStart >> 8);
		InBuf[1] = (BYTE)(RegStart & 0xff);
		InBuf[2] = 0;
		InBuf[3] = (BYTE) RegCount%READ_REG_COUNT_MAX;	
		ret = MasterModBus(FunCode,InBuf,pOut,TIME_OUT);
		if(ret != MB_EOK)return ret;
	}
	return ret;
}

eMBErrorCode MasterWrite(DWORD RegStart,DWORD RegCount,BYTE *pIn)
{
	eMBErrorCode ret;
	DWORD i,j;
	BYTE InBuf[80];

	//·¶Î§¼ì²é

	for(i=0;i<RegCount/WRITE_REG_COUNT_MAX;i++)
	{
		InBuf[0] = (BYTE)(RegStart >> 8);
		InBuf[1] = (BYTE)(RegStart & 0xff);
		InBuf[2] = 0;
		InBuf[3] = WRITE_REG_COUNT_MAX;
		InBuf[4] = 2*WRITE_REG_COUNT_MAX;
		for(j=0;j<InBuf[4];j=j+2)
		{
			InBuf[5+j] = pIn[j+1];
			InBuf[5+j+1] = pIn[j];
		}
		ret = MasterModBus(MB_FUNC_WRITE_MULTIPLE_REGISTERS,InBuf,NULL,TIME_OUT);
		if(ret != MB_EOK)return ret;
		RegStart += WRITE_REG_COUNT_MAX;
		pIn += (2*WRITE_REG_COUNT_MAX);
	}

	if(RegCount%WRITE_REG_COUNT_MAX)
	{
		InBuf[0] = (BYTE)(RegStart >> 8);
		InBuf[1] = (BYTE)(RegStart & 0xff);
		InBuf[2] = 0;
		InBuf[3] = (BYTE) RegCount%WRITE_REG_COUNT_MAX;
		InBuf[4] = 2*InBuf[3];
		for(j=0;j<InBuf[4];j=j+2)
		{
			InBuf[5+j] = pIn[j+1];
			InBuf[5+j+1] = pIn[j];
		}
		ret = MasterModBus(MB_FUNC_WRITE_MULTIPLE_REGISTERS,InBuf,NULL,TIME_OUT);
		if(ret != MB_EOK)return ret;
	}
	return ret;
}

eMBErrorCode MasterModBus(BYTE FunCode,BYTE *pIn,BYTE *pOut,DWORD ms)
{
	int i;
	BYTE HidBuf[HID_PACK_MAX+1];
	HidBuf[HID_PACK_CH] = REPORT_ID;
	HidBuf[HID_PACK_TYPE] = MB_HID_PROTOCOL_ID;
	HidBuf[HID_PACK_MODBUS] = FunCode;
	switch(FunCode)
	{
	case MB_FUNC_READ_INPUT_REGISTER:	//Modbus function 0x04 Read Input Registers
		if(0) //·¶Î§¼ì²é
			return MB_ENOREG;
		HidBuf[HID_PACK_LEN] = 7;
		break;
	case MB_FUNC_READ_HOLDING_REGISTER:  //Modbus function 0x03 Read Holding Registers
		if(0) //·¶Î§¼ì²é
			return MB_ENOREG;
		HidBuf[HID_PACK_LEN] = 7;
		break;
	case MB_FUNC_WRITE_MULTIPLE_REGISTERS:	//Modbus function 0x10 Write Multiple Registers
		if(0) //·¶Î§¼ì²é
			return MB_ENOREG;
		HidBuf[HID_PACK_LEN] = 7+(pIn[4]+1);
		if(HidBuf[HID_PACK_LEN] > HID_PACK_MAX)return MB_ELEN;
		break;
	default:
		return MB_EILLFUNCTION;
	}
	//copy from pD
	for(i=0;i<HidBuf[HID_PACK_LEN]-3;i++)
		HidBuf[HID_PACK_MODBUS+1+i]=pIn[i];

	//trans
	if(LoggedWrite(HidBuf,HID_PACK_MAX+1)==FALSE)return MB_EIO;
	//rece
	HidBuf[HID_PACK_CH]=REPORT_ID;
	if(LoggedRead(HidBuf,HID_PACK_MAX+1,ms)==FALSE)return MB_ETIMEDOUT;
	if(HidBuf[HID_PACK_LEN] > HID_PACK_MAX)return MB_ELEN;
	

	if(HidBuf[HID_PACK_MODBUS] == FunCode)
	{
		switch(FunCode)
		{
		case MB_FUNC_READ_INPUT_REGISTER:	//Modbus function 0x04 Read Input Registers
		case MB_FUNC_READ_HOLDING_REGISTER:  //Modbus function 0x03 Read Holding Registers
			if((HidBuf[HID_PACK_LEN] != HidBuf[HID_PACK_MODBUS+1]+4) || (HidBuf[HID_PACK_LEN] & 0x01))return MB_ELEN;
			//copy to pOut
			for(i=0;i<HidBuf[HID_PACK_MODBUS+1];i=i+2)
			{
				pOut[i] = HidBuf[HID_PACK_MODBUS+2+i+1]; 
				pOut[i+1] = HidBuf[HID_PACK_MODBUS+2+i]; 
			}
			break;
		case MB_FUNC_WRITE_MULTIPLE_REGISTERS:	//Modbus function 0x10 Write Multiple Registers
			HidBuf[HID_PACK_LEN] = 0+5+(HidBuf[HID_PACK_MODBUS+5]*2+1);	
			break;
		}
	}
	else if(HidBuf[HID_PACK_MODBUS] == (FunCode | 0x80))
		return (eMBErrorCode)HidBuf[HID_PACK_MODBUS+1];
	else
		return MB_ERETURN;

	return MB_EOK;
}