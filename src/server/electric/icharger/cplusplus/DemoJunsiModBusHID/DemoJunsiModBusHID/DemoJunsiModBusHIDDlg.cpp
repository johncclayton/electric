// DemoJunsiModBusHIDDlg.cpp : implementation file
//

#include "stdafx.h"
#include "DemoJunsiModBusHID.h"
#include "DemoJunsiModBusHIDDlg.h"

#ifdef _DEBUG
#define new DEBUG_NEW
#endif


// CDemoJunsiModBusHIDDlg dialog




CDemoJunsiModBusHIDDlg::CDemoJunsiModBusHIDDlg(CWnd* pParent /*=NULL*/)
	: CDialog(CDemoJunsiModBusHIDDlg::IDD, pParent)
	, txtTimeStamp(_T(""))
	, txtCell1(_T(""))
	, txtCell2(_T(""))
	, txtCell3(_T(""))
	, txtCell5(_T(""))
	, txtCell6(_T(""))
	, txtCell7(_T(""))
	, txtCell8(_T(""))
	, txtCell9(_T(""))
	, txtCell10(_T(""))
	, txtCell4(_T(""))
	, txtInput(_T(""))
	, txtOutput(_T(""))
	, txtCurrent(_T(""))
{
	m_hIcon = AfxGetApp()->LoadIcon(IDR_MAINFRAME);
}

void CDemoJunsiModBusHIDDlg::DoDataExchange(CDataExchange* pDX)
{
	CDialog::DoDataExchange(pDX);
	DDX_Control(pDX, IDC_LIST1, m_DeviceList);
	DDX_Control(pDX, IDC_COMBO1, mMemoryIndex);
	DDX_Control(pDX, IDC_BUTTON9, m_Receive);
	DDX_Text(pDX, IDC_TIMER, txtTimeStamp);
	DDX_Text(pDX, IDC_CELL1, txtCell1);
	DDX_Text(pDX, IDC_CELL2, txtCell2);
	DDX_Text(pDX, IDC_CELL3, txtCell3);
	DDX_Text(pDX, IDC_CELL5, txtCell5);
	DDX_Text(pDX, IDC_CELL6, txtCell6);
	DDX_Text(pDX, IDC_CELL7, txtCell7);
	DDX_Text(pDX, IDC_CELL8, txtCell8);
	DDX_Text(pDX, IDC_CELL9, txtCell9);
	DDX_Text(pDX, IDC_CELL10, txtCell10);
	DDX_Text(pDX, IDC_CELL4, txtCell4);
	DDX_Text(pDX, IDC_Input, txtInput);
	DDX_Text(pDX, IDC_Output, txtOutput);
	DDX_Text(pDX, IDC_Current, txtCurrent);
}

BEGIN_MESSAGE_MAP(CDemoJunsiModBusHIDDlg, CDialog)
	ON_WM_PAINT()
	ON_WM_QUERYDRAGICON()
	//}}AFX_MSG_MAP
	ON_WM_DEVICECHANGE()
	ON_BN_CLICKED(IDOK, &CDemoJunsiModBusHIDDlg::OnBnClickedOk)
	ON_BN_CLICKED(IDC_BUTTON1, &CDemoJunsiModBusHIDDlg::OnBnClickedReadMem)
	ON_BN_CLICKED(IDC_BUTTON2, &CDemoJunsiModBusHIDDlg::OnBnClickedButton2)
	ON_BN_CLICKED(IDC_BUTTON3, &CDemoJunsiModBusHIDDlg::OnBnClickedButton3)
	ON_BN_CLICKED(IDC_BUTTON4, &CDemoJunsiModBusHIDDlg::OnBnClickedButton4)
	ON_BN_CLICKED(IDC_BUTTON5, &CDemoJunsiModBusHIDDlg::OnBnClickedButton5)
	ON_BN_CLICKED(IDC_BUTTON6, &CDemoJunsiModBusHIDDlg::OnBnClickedButton6)
	ON_BN_CLICKED(IDC_BUTTON7, &CDemoJunsiModBusHIDDlg::OnBnClickedButton7)
	ON_BN_CLICKED(IDC_BUTTON8, &CDemoJunsiModBusHIDDlg::OnBnClickedButton8)
	ON_BN_CLICKED(IDC_BUTTON9, &CDemoJunsiModBusHIDDlg::OnBnClickedButton9)
	ON_WM_TIMER()
	ON_BN_CLICKED(IDC_BUTTON10, &CDemoJunsiModBusHIDDlg::OnBnClickedButton10)
	ON_BN_CLICKED(IDC_BUTTON11, &CDemoJunsiModBusHIDDlg::OnBnClickedButton11)
	ON_BN_CLICKED(IDC_BUTTON_DUMP_LOGS, &CDemoJunsiModBusHIDDlg::OnBnClickedButtonDumpLogs)
	ON_BN_CLICKED(IDC_BUTTON_STOP2, &CDemoJunsiModBusHIDDlg::OnBnClickedButtonStop2)
	ON_BN_CLICKED(IDC_BUTTON_RUN2, &CDemoJunsiModBusHIDDlg::OnBnClickedButtonRun2)
END_MESSAGE_MAP()


// CDemoJunsiModBusHIDDlg message handlers

BOOL CDemoJunsiModBusHIDDlg::OnInitDialog()
{
	CDialog::OnInitDialog();

	// Set the icon for this dialog.  The framework does this automatically
	//  when the application's main window is not a dialog
	SetIcon(m_hIcon, TRUE);			// Set big icon
	SetIcon(m_hIcon, FALSE);		// Set small icon

	// TODO: Add extra initialization here
	FillDeviceList();

	for(int i=0;i<LIST_MEM_MAX;i++)
	{
		char buf[16];
		sprintf(buf,"Memory %02d",i);
		mMemoryIndex.InsertString(i,buf);
	}
	mMemoryIndex.SetCurSel(0);
	return TRUE;  // return TRUE  unless you set the focus to a control
}

// If you add a minimize button to your dialog, you will need the code below
//  to draw the icon.  For MFC applications using the document/view model,
//  this is automatically done for you by the framework.

void CDemoJunsiModBusHIDDlg::OnPaint()
{
	if (IsIconic())
	{
		CPaintDC dc(this); // device context for painting

		SendMessage(WM_ICONERASEBKGND, reinterpret_cast<WPARAM>(dc.GetSafeHdc()), 0);

		// Center icon in client rectangle
		int cxIcon = GetSystemMetrics(SM_CXICON);
		int cyIcon = GetSystemMetrics(SM_CYICON);
		CRect rect;
		GetClientRect(&rect);
		int x = (rect.Width() - cxIcon + 1) / 2;
		int y = (rect.Height() - cyIcon + 1) / 2;

		// Draw the icon
		dc.DrawIcon(x, y, m_hIcon);
	}
	else
	{
		CDialog::OnPaint();
	}
}

// The system calls this function to obtain the cursor to display while the user drags
//  the minimized window.
HCURSOR CDemoJunsiModBusHIDDlg::OnQueryDragIcon()
{
	return static_cast<HCURSOR>(m_hIcon);
}

BOOL CDemoJunsiModBusHIDDlg::OnDeviceChange(UINT nEventType, DWORD dwData)
{
	switch(nEventType)
	{
	case DBT_DEVICEARRIVAL:        
			// A device has been inserted and is now available.
			
		// Fall through

	case DBT_DEVICEREMOVECOMPLETE:
	case DBT_DEVNODES_CHANGED: /*DoRegisterDeviceInterface*/
			// Device has been removed.
			
		FillDeviceList();

		break;    

	default:        
		break;    
	}

	return TRUE;
}


HidEnum JsHidEnum;

void CDemoJunsiModBusHIDDlg::Enum(void)
{
	CUSBDevice JsUSB;
    HANDLE deviceHandle = INVALID_HANDLE_VALUE;
    DWORD index = 0;
    HIDD_ATTRIBUTES deviceAttributes;

	JsHidEnum.Count = 0;

    while (JsUSB.ConnectToIthDevice (index) == TRUE)
    {
		if(JsUSB.handle != INVALID_HANDLE_VALUE)
		{
			if(HidD_GetAttributes (JsUSB.handle , &deviceAttributes))
			{
				if((deviceAttributes.VendorID == JSHID_VENDORID) && ((deviceAttributes.ProductID & 0xfff0) == JSHID_PRODUCTID))
				//if((deviceAttributes.VendorID == JSHID_VENDORID) && (deviceAttributes.ProductID == JSHID_PRODUCTID))
				{
					JsHidEnum.Info[JsHidEnum.Count].Index = index;
					JsHidEnum.Info[JsHidEnum.Count].Attributes = deviceAttributes;
					HidD_GetProductString(JsUSB.handle, JsHidEnum.Info[JsHidEnum.Count].Name, sizeof(JsHidEnum.Info[JsHidEnum.Count].Name));
					HidD_GetSerialNumberString (JsUSB.handle, JsHidEnum.Info[JsHidEnum.Count].SerialNum, sizeof(JsHidEnum.Info[JsHidEnum.Count].SerialNum));
					JsHidEnum.Count++;
				}
			}
		}
	
//#ifdef _DEBUG
//		TRACE("HID Device - Vendor 0x%x, Product 0x%x, Version 0x%x \r\n", deviceAttributes.VendorID, deviceAttributes.ProductID, deviceAttributes.VersionNumber);
//#endif 
		JsUSB.Disconnect();		
        index++;
    }
    return;
}

void CDemoJunsiModBusHIDDlg::FillDeviceList(void)
{
	Enum();
	m_DeviceList.ResetContent();

	if(JsHidEnum.Count == 0)
	{
		m_DeviceList.AddString(_T("Device not found!"));
		//m_Receive.EnableWindow(FALSE);
	}
	else
	{
		for (int ii=0; ii<JsHidEnum.Count; ii++) {
			CString strName;
			for (int x = 0; JsHidEnum.Info[ii].Name[x]; x++) {
				strName += (char)JsHidEnum.Info[ii].Name[x];
			}

			CString strSN;
			for (int x = 0; JsHidEnum.Info[ii].SerialNum[x]; x++) {
				strSN += (char)JsHidEnum.Info[ii].SerialNum[x];
			}
			m_DeviceList.InsertString(ii,_T("Type: ") + strName +_T(", S/N:") + strSN);
		}
//		m_Receive.EnableWindow(TRUE);
	}
	m_DeviceList.SetCurSel(0);
}

#include "MasterModBus.h"

extern eMBErrorCode MasterModBus(BYTE FunCode,BYTE *pIn,BYTE *pOut,DWORD ms);
extern CUSBDevice JsHID;
void CDemoJunsiModBusHIDDlg::OnBnClickedOk()
{
	// TODO: 在此添加控件通知处理程序代码
//	OnOK();
}

SYSTEM System;
void CDemoJunsiModBusHIDDlg::OnBnClickedReadMem()
{
	// TODO: 在此添加控件通知处理程序代码
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}
	if(	MasterRead(0,REG_HOLDING_SYS_START,(sizeof(SYSTEM)+1)/2,(BYTE *)&System) == MB_EOK)
		AfxMessageBox("OK");
	else 
		AfxMessageBox("error");
	JsHID.Disconnect();
}

#if 1
BOOL TransOrder(BYTE order)
{
	u16 temp[2];
	temp[0] = VALUE_ORDER_KEY;
	temp[1] = order;
	if(	MasterWrite(REG_ORDER_KEY,2,(BYTE *)&temp[0]) != MB_EOK)
		return FALSE;

	temp[0] = 0;
	if(	MasterWrite(REG_ORDER_KEY,1,(BYTE *)&temp[0]) != MB_EOK)
		return FALSE;

	return TRUE;
}
#else
BOOL TransOrder(BYTE order)
{
	u16 temp;
	temp = VALUE_ORDER_KEY;
	if(	MasterWrite(REG_ORDER_KEY,1,(BYTE *)&temp) != MB_EOK)
		return FALSE;

	if(	MasterWrite(REG_ORDER,1,(BYTE *)&order) != MB_EOK)
		return FALSE;

	temp = 0;
	if(	MasterWrite(REG_ORDER_KEY,1,(BYTE *)&temp) != MB_EOK)
		return FALSE;

	return TRUE;
}
#endif

void CDemoJunsiModBusHIDDlg::OnBnClickedButton2()
{
	// TODO: 在此添加控件通知处理程序代码
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}

	//更改参数
	System.TempFansOn=500;
	System.LightValue=10;

	if(	MasterWrite(REG_HOLDING_SYS_START,(sizeof(SYSTEM)+1)/2,(BYTE *)&System) != MB_EOK)
	{
		AfxMessageBox("error1");
		JsHID.Disconnect();
		return;
	}

	//保存更改
	if(TransOrder(ORDER_WRITE_SYS)==FALSE)
	{
		AfxMessageBox("error2");
		JsHID.Disconnect();
		return;
	}
	AfxMessageBox("OK");
	JsHID.Disconnect();
}

MEM_HEAD MemHead;
void CDemoJunsiModBusHIDDlg::OnBnClickedButton3()
{
	// TODO: 在此添加控件通知处理程序代码
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}
	if(	MasterRead(0,REG_HOLDING_MEM_HEAD_START,(sizeof(MEM_HEAD)+1)/2,(BYTE *)&MemHead) == MB_EOK )
		AfxMessageBox("OK");
	else 
		AfxMessageBox("error");
	JsHID.Disconnect();
}

void CDemoJunsiModBusHIDDlg::OnBnClickedButton4()
{
	// TODO: 在此添加控件通知处理程序代码
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}

	//更改参数
	MemHead.Count=6;

	if(	MasterWrite(REG_HOLDING_MEM_HEAD_START,(sizeof(MEM_HEAD)+1)/2,(BYTE *)&MemHead) != MB_EOK )
	{
		AfxMessageBox("error1");
		JsHID.Disconnect();
		return;
	}

	//保存更改
	if(TransOrder(ORDER_WRITE_MEM_HEAD)==FALSE)
	{
		AfxMessageBox("error2");
		JsHID.Disconnect();
		return;
	}
	AfxMessageBox("OK");
	JsHID.Disconnect();
}

MEMORY Memory;
const MEMORY MemDefault = MEMORY_DEFAULT;
void CDemoJunsiModBusHIDDlg::OnBnClickedButton5()
{
	// TODO: 在此添加控件通知处理程序代码
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}

	//写入保存地址
	u16 Index;
	Index = mMemoryIndex.GetCurSel();
	if(	MasterWrite(REG_SEL_MEM,1,(BYTE *)&Index) != MB_EOK )
	{
		AfxMessageBox("error2");
		JsHID.Disconnect();
		return;
	}

	if(	MasterRead(0,REG_HOLDING_MEM_START,(sizeof(MEMORY)+1)/2,(BYTE *)&Memory) == MB_EOK )
		AfxMessageBox("OK");
	else 
		AfxMessageBox("error");
	JsHID.Disconnect();
}

void CDemoJunsiModBusHIDDlg::OnBnClickedButton6()
{
	// TODO: 在此添加控件通知处理程序代码
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}

	//写入保存地址
	u16 Index;
	Index = mMemoryIndex.GetCurSel();
	if(	MasterWrite(REG_SEL_MEM,1,(BYTE *)&Index) != MB_EOK )
	{
		AfxMessageBox("error2");
		JsHID.Disconnect();
		return;
	}

	//更改参数
	Memory.LiCell=6;
	if(	MasterWrite(REG_HOLDING_MEM_START,(sizeof(MEMORY)+1)/2,(BYTE *)&Memory) != MB_EOK )
	{
		AfxMessageBox("error1");
		JsHID.Disconnect();
		return;
	}


	//保存更改
	if(TransOrder(ORDER_WRITE_MEM)==FALSE)
	{
		AfxMessageBox("error3");
		JsHID.Disconnect();
		return;
	}
	AfxMessageBox("OK");
	JsHID.Disconnect();
}

void CDemoJunsiModBusHIDDlg::OnBnClickedButton7()
{
	StartChannelProgram(0, 0);
}

void CDemoJunsiModBusHIDDlg::StartChannelProgram(int channel, int program)
{
	// TODO: 在此添加控件通知处理程序代码
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}

	u16 RunOrderBuf[5];
	RunOrderBuf[0] = 3;//mRunProgram.GetCurSel();
	RunOrderBuf[1] = program;//mSelMemory.GetCurSel();
	RunOrderBuf[2] = channel;//mChannel.GetCurSel();
	RunOrderBuf[3] = VALUE_ORDER_KEY; //REG_ORDER_KEY
	RunOrderBuf[4] = ORDER_RUN;

	CString str;
	str.Format("Charge/Channel/%d/%d", channel, program);
	MasterLog l((LPCTSTR)str);

	if(	MasterWrite(REG_SEL_OP,5,(BYTE *)RunOrderBuf) != MB_EOK )
	{
		AfxMessageBox("error1");
		JsHID.Disconnect();
		return;
	}

	JsHID.Disconnect();
}

void CDemoJunsiModBusHIDDlg::OnBnClickedButton8()
{
	StopChannel(0);
}

void CDemoJunsiModBusHIDDlg::StopChannel(int channel)
{
	// TODO: 在此添加控件通知处理程序代码
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}

	MasterLog l("Stop");

	u16 RunOrderBuf[3];

	RunOrderBuf[0] = channel;//mChannel.GetCurSel();
	RunOrderBuf[1] = VALUE_ORDER_KEY; //REG_ORDER_KEY
	RunOrderBuf[2] = ORDER_STOP;

	if(	MasterWrite(REG_SEL_CHANNEL,3,(BYTE *)RunOrderBuf) != MB_EOK )
	{
		AfxMessageBox("error1");
		JsHID.Disconnect();
		return;
	}

	JsHID.Disconnect();
}


void CDemoJunsiModBusHIDDlg::GetShowValue(CString *pStr,DWORD Value,WORD Len,WORD Dot)
{
	if(Value<0)
	{
		Value = -Value;
		if(Dot==1)
			pStr->Format("-%d.%01u",Value/10,Value%10);
		else if(Dot==2)
			pStr->Format("-%d.%02u",Value/100,Value%100);
		else if(Dot==3)
			pStr->Format("-%d.%03u",Value/1000,Value%1000);
		else if(Dot==4)
			pStr->Format("-%d.%04u",Value/10000,Value%10000);
		else
			pStr->Format("-%d",Value);
	}
	else
	{
		if(Dot==1)
			pStr->Format("%d.%01u",Value/10,Value%10);
		else if(Dot==2)
			pStr->Format("%d.%02u",Value/100,Value%100);
		else if(Dot==3)
			pStr->Format("%d.%03u",Value/1000,Value%1000);
		else if(Dot==4)
			pStr->Format("%d.%04u",Value/10000,Value%10000);
		else
			pStr->Format("%d",Value);
	}

}

#define CELL_MAX 10
typedef __packed struct _INF_
{
	u32 TimeStamp;
	u32 PowerOut;
	s16 Current;
	u16 Vin;
	u16 Vout;
	u32 Cap;
	s16 TempInt;
	s16 TempExt;
	u16 Cell[CELL_MAX];
}INF;

INF Inf;

void CDemoJunsiModBusHIDDlg::ShowInf(void)
{
	
	GetShowValue(&txtTimeStamp,Inf.TimeStamp,10,0);
	GetShowValue(&txtInput,Inf.Vin,5,3);
	GetShowValue(&txtOutput,Inf.Vout,5,3);
	GetShowValue(&txtCurrent,Inf.Current,5,2);

	GetShowValue(&txtCell1,Inf.Cell[0],5,3);
	GetShowValue(&txtCell2,Inf.Cell[1],5,3);
	GetShowValue(&txtCell3,Inf.Cell[2],5,3);
	GetShowValue(&txtCell4,Inf.Cell[3],5,3);
	GetShowValue(&txtCell5,Inf.Cell[4],5,3);
	GetShowValue(&txtCell6,Inf.Cell[5],5,3);
	GetShowValue(&txtCell7,Inf.Cell[6],5,3);
	GetShowValue(&txtCell8,Inf.Cell[7],5,3);
	GetShowValue(&txtCell9,Inf.Cell[8],5,3);
	GetShowValue(&txtCell10,Inf.Cell[9],5,3);

	//	Inf.Current = *((SHORT *)&pBuf[Count]);
	//	Count += sizeof(Inf.Current);
	//	GetShowValue(&txtCurrent,Inf.Current,5,2);	

	//	Inf.Volt = *((USHORT *)&pBuf[Count]);
	//	Count += sizeof(Inf.Volt);
	//	GetShowValue(&txtVoltage,Inf.Volt,5,2);

	//	Inf.Cap = *((DWORD *)&pBuf[Count]);
	//	Count += sizeof(Inf.Cap);
	//	GetShowValue(&txtCap,Inf.Cap,6,0);

	//	for(i=0;i<6;i++)
	//	{
	//		Inf.Cell[i] = *((SHORT *)&pBuf[Count]);
	//		Count += sizeof(Inf.Cell[i]);
	//	}


	//	Inf.RPM = *((USHORT *)&pBuf[Count]);
	//	Count += sizeof(Inf.RPM);
	//	GetShowValue(&txtRPM,Inf.RPM,6,0);


	//	for(i=0;i<4;i++)
	//	{
	//		Inf.Temp[i] = *((SHORT *)&pBuf[Count]);
	//		Count += sizeof(Inf.Temp[i]);
	//		
	//	}
	//	GetShowValue(&txtIntTemp,Inf.Temp[0],4,1);
	//	if(Inf.Temp[1]==0x7fff)
	//		txtExtTemp1 = _T("NULL");
	//	else
	//		GetShowValue(&txtExtTemp1,Inf.Temp[1],4,1);
	//	if(Inf.Temp[2]==0x7fff)
	//		txtExtTemp2 = _T("NULL");
	//	else
	//		GetShowValue(&txtExtTemp2,Inf.Temp[2],4,1);
	//	if(Inf.Temp[3]==0x7fff)
	//		txtExtTemp3 = _T("NULL");
	//	else
	//		GetShowValue(&txtExtTemp3,Inf.Temp[3],4,1);

	//	Inf.Period = *((USHORT *)&pBuf[Count]);
	//	Count += sizeof(Inf.Period);
	//	GetShowValue(&txtPeriod,Inf.Period,6,0);

	//	Inf.Pulse = *((USHORT *)&pBuf[Count]);
	//	Count += sizeof(Inf.Pulse);
	//	GetShowValue(&txtPulse,Inf.Pulse,6,0);
	//}

}



BOOL IsReceFlag = FALSE;
void CDemoJunsiModBusHIDDlg::OnBnClickedButton9()
{
	// TODO: 在此添加控件通知处理程序代码
	if(IsReceFlag == FALSE)
	{
		if(JsHidEnum.Count==0)return;
		if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
		{
			return;
		}
		m_Receive.SetWindowTextA(_T("Stop"));
		IsReceFlag = TRUE;
		SetTimer(1,500,NULL);
	}
	else
	{
		IsReceFlag = FALSE;
		KillTimer(1);
		JsHID.Disconnect();
		m_Receive.SetWindowTextA(_T("Connect"));
	}

	
	//if(JsHidEnum.Count==0)return;
	//if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	//{
	//	return;
	//}
	//if(	MasterRead(1,REG_INPUT_CH1_START,(sizeof(INF)+1)/2,(BYTE *)&Inf) == MB_EOK )
	//	AfxMessageBox("OK");
	//else 
	//	AfxMessageBox("error");
	//JsHID.Disconnect();
}

void CDemoJunsiModBusHIDDlg::OnTimer(UINT_PTR nIDEvent)
{
	// TODO: 在此添加消息处理程序代码和/或调用默认值
	if(	MasterRead(1,REG_INPUT_CH1_START,(sizeof(INF)+1)/2,(BYTE *)&Inf) == MB_EOK )
	{
		ShowInf();
		UpdateData(FALSE);
	}
	CDialog::OnTimer(nIDEvent);
}

#define REG_INPUT_CAP_OFFSET	7
void CDemoJunsiModBusHIDDlg::OnBnClickedButton10()
{
	// TODO: 在此添加控件通知处理程序代码
	s32 Cap;
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}
	if(	MasterRead(1,REG_INPUT_CH1_START+REG_INPUT_CAP_OFFSET,2,(BYTE *)&Cap) == MB_EOK )
	{
		char str[20];
		sprintf(str,"Cap: %dmAh",Cap);
		AfxMessageBox(str);
	}
	JsHID.Disconnect();
}

#define REG_INPUT_IR_OFFSET	35
void CDemoJunsiModBusHIDDlg::OnBnClickedButton11()
{
	// TODO: 在此添加控件通知处理程序代码
	u16 IR[10];
	if(JsHidEnum.Count==0)return;
	if(JsHID.ConnectToIthDevice(JsHidEnum.Info[m_DeviceList.GetCurSel()].Index)==FALSE)
	{
		return;
	}
	if(	MasterRead(1,REG_INPUT_CH2_START+REG_INPUT_IR_OFFSET,10,(BYTE *)&IR) == MB_EOK )
	{
		char str[500];
		int i;
		int len=0;
		for(i=0;i<10;i++)
		{
			len +=sprintf(&str[len],"%d:%d ",i+1,IR[i]);
		}
		AfxMessageBox(str);
	}
	JsHID.Disconnect();
}


void CDemoJunsiModBusHIDDlg::OnBnClickedButtonDumpLogs()
{
	DumpLogRecords();
}


void CDemoJunsiModBusHIDDlg::OnBnClickedButtonStop2()
{
	StopChannel(1);
}

void CDemoJunsiModBusHIDDlg::OnBnClickedButtonRun2()
{
	StartChannelProgram(1, 0);
}
