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
	afx_msg void OnBnClickedButton9();
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
	ORDER_STOP,	//停止运行
	ORDER_RUN,	//运行
	ORDER_MODIFY,	//运行时更改参数
	ORDER_WRITE_SYS,//SYSTEM数据保存到flash中
	ORDER_WRITE_MEM_HEAD,
	ORDER_WRITE_MEM,//MEMORY数据保存到flash中
	ORDER_TRANS_LOG_ON,	//开启Log传输
	ORDER_TRANS_LOG_OFF,//关闭Log传输
	ORDER_MSGBOX_YES, //对话框回应<YES>
	ORDER_MSGBOX_NO, //对话框回应<NO>
};

#define REG_HOLDING_SYS_START 0x8400
#define REG_HOLDING_SYS_NREGS ((sizeof(SYSTEM)+1)/2)

#define REG_HOLDING_MEM_HEAD_START 0x8800
#define REG_HOLDING_MEM_HEAD_NREGS ((sizeof(MEM_HEAD)+1)/2)

#define REG_HOLDING_MEM_START 0x8c00
#define REG_HOLDING_MEM_NREGS ((sizeof(MEMORY)+1)/2)
