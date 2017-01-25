#include "stdafx.h"
#include "MasterModBus.h"
#include "usb.h"

CUSBDevice JsHID;
#define READ_REG_COUNT_MAX		((HID_PACK_MAX-4)/2) //30
#define WRITE_REG_COUNT_MAX		((HID_PACK_MAX-8)/2) //28
#define TIME_OUT	500
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
	if(JsHID.Write(HidBuf,HID_PACK_MAX+1)==FALSE)return MB_EIO;
	//rece
	HidBuf[HID_PACK_CH]=REPORT_ID;
	if(JsHID.Read(HidBuf,HID_PACK_MAX+1,ms)==FALSE)return MB_ETIMEDOUT;
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