#ifndef _MEMSTRUCT
#define _MEMSTRUCT

//#include "datatype.h"
#ifdef _MSC_VER   
#define __packed   
#pragma pack(1)   
#endif 

typedef unsigned long	u32;
typedef signed long	s32;
typedef unsigned short	u16;
typedef signed short	s16;
typedef unsigned char u8;
typedef signed char s8;

#define MODEL_MAX	2
typedef  struct _SYSTEM
{
	u16 TempUnit;					//温度单位
	u16 TempStop;					//停机温度
	u16 TempFansOn;					//风扇开启温度
	u16 TempReduce;					//功率衰减温度
	u16 FansSpeed;					//风扇旋转强度
	u16 FansOffDelay;				//风扇关闭延时 
	u16 LcdContraste;				//LCD对比度
	u16 LightValue;					//背光强度
	u16 BeepMode;					//声音提示 DEL
	u16 BeepType[4];				//声音类型 长音,短音,连续音
	u16 BeepEnable[4];				//声音允许 按键声音,提示声音,报警声音,完成声音
	u16 BeepVOL[4];					//声音音量 按键音量,提示音量,报警音量,完成音量
	u16 DoneBeepType;				//完成音类型 响5声,响3分钟,一直响,关闭
	u16 SelectAdj;					//当前校准值 =0:系统校准值; =1:用户校准值
	u16 Ver;						//系统参数的版本
	u16 SelInputSource;				//输入源选择 =0:DC =1:Bat. =2:用户选择
	u16 DCInputLowVolt;				//DC输入电压低压保护
	u16 DCInputOverVolt;			//DC输入电压高压保护
	s16 DCInputCurrentLimit;		//DC输入电流最大限制
	u16 BatInputLowVolt;			//BAT输入电压低压保护
	u16 BatInputOverVolt;			//BAT输入电压高压保护
	s16 BatInputCurrentLimit;		//BAT输入电流最大限制
	u16 RegEnable;					//回收允许
	u16 RegVoltLimit;				//回收电压限制
	s16	RegCurrentLimit;			//回收电流限制
	u16 ChargePower[MODEL_MAX];		//充电功率
	u16 DischargePower[MODEL_MAX];	//放电功率
	u16 ProPower;					//功率分配优先级 0=平均分配; 1=CH1优先; 2=CH2优先
	u16 MonitorLogInterval[MODEL_MAX];			//采样间隔 0.1S 为1个单位
	u16 MonitorLogSaveToSD[MODEL_MAX];			//=0:不输出log到SD =1:输出log到SD

	u16 ServoType;			//舵机类型
	u16 ServoUserCenter;	//舵机脉冲中心点
	u16 ServoUserRate;		//舵机帧刷新率
	u16 ServoUserOpAngle;	//45度脉宽
	
	u16 ModBusMode;		//=0:不启用ModBus =1:启用HID ModBus =2:启用Serial ModBus
	u16 ModBusAddr;		//串行通讯时的地址


	u16 Dump[10];					//保留
}SYSTEM;

#define LIST_MEM_MAX		64
typedef struct _MEM_HEAD
{
	u16 Count;
	u8 Index[LIST_MEM_MAX];//0xff表示空 0xfe标识隐藏  0-LIST_MEM_MAX
}MEM_HEAD;
#define MEM_HEAD_DEFAULT	{7,{0,1,2,3,4,5,6}}

enum{
	BAL_START_CV,
	BAL_START_CV_100,
	BAL_START_CV_200,
	BAL_START_CV_300,
	BAL_START_CV_400,
	BAL_START_CV_500,
	BAL_START_CV_600,
	BAL_START_CV_700,
	BAL_START_CV_800,
	BAL_START_CV_900,
	BAL_START_CV_1000,
	BAL_START_ALWAY,
};

enum{
	BAL_SPEED_SLOW,
	BAL_SPEED_NORMAL,
	BAL_SPEED_FAST,
	BAL_SPEED_USER,
};

enum{
	LI_MODE_C_BAL,	//充电平衡
	LI_MODE_C_NOTBAL,//充电不平衡
};

enum{
	NI_MODE_C_NORMAL,
	NI_MODE_C_REFLEX,
};

enum{
	PB_MODE_C_NORMAL,
	PB_MODE_C_REFLEX,
};

enum{
	CYCLE_MODE_C2D,
	CYCLE_MODE_D2C,
};

enum{
	REG_DCHG_OFF,
	REG_DCHG_INPUT,
	REG_DCHG_CH,
	REG_DCHG_AUTO,
};

#define MEM_NAME_LEN	37
typedef __packed struct _MEMORY
{
	u16 UseFlag;					//使用标记
	s8 Name[MEM_NAME_LEN+1];		//程序名称
	u32 Capacity;					//标称容量
	u8 AutoSave;					//程序运行自动保存
	u8 LiBalEndMode;				//Li电池平衡结束电流模式
	u8 LockFlag;					//程序锁定标记
	u8 LockPWD[6];					//程序锁定密码
	u16 OpEnable;					//模块是否使用:用bit0-15位分别表示Charge(bit0) ,Storage(bit2) ,Discharge(bit3) ,Cycle(bit4) ,OnlyBalance(bit5) 

	u8 ChannelMode;					//CH1|CH2,CH1&CH2,CH1,CH2	
	u8 SaveToSD;					//=0:不输出log到SD =1:输出log到SD
	u16 LogInterval;				//采样间隔 0.1S 为1个单位
	u16 RunCounter;					//运行次数统计 

	u8 Type;						//类型: LiPo,LiLo,LiFe,NiMH,Nicd,Pb
	u8 LiCell;						//Li电池串数
	u8 NiCell;						//Ni电池串数
	u8 PbCell;						//Pb电池串数

	u8 LiModeC;						//冲电模式: Normal,Balance
	u8 LiModeD;						//放电模式: Normal,Balance,External
	u8 NiModeC;						//冲电模式: Normal,REFLEX
	u8 NiModeD;						//放电模式: 
	u8 PbModeC;						//冲电模式: Normal,REFLEX
	u8 PbModeD;						//放电模式: 

	u8 BalSpeed;					//平衡速度: 0--slow 1--normal 2--fast
	u8 BalStartMode;				//平衡起始模式: 0--总是 1--CV阶段 2--指定起始电压点 
	u16 BalStartVolt;				//平衡起始电压
	u8 BalDiff;						//平衡停止精度(mV)
	u8 BalOverPoint;				//平衡器超压值
	u8 BalSetPoint;					//平衡充电结束时的最低压差与设置值.比如: 4.2V充LiPo,BalSetPoint=5,那就4.195V可以停止
	u8 BalDelay;					//平衡推迟结束时间
	
	u8 KeepChargeEnable;			//续冲

	u16 LiPoChgCellVolt;			//LiPo电池单体充电电压
	u16 LiLoChgCellVolt;			//LiLo电池单体充电电压
	u16 LiFeChgCellVolt;			//LiFe电池单体充电电压
	
	u16 LiPoStoCellVolt;			//LiPo电池单体存储电压
	u16 LiLoStoCellVolt;			//LiLo电池单体存储电压
	u16 LiFeStoCellVolt;			//LiFe电池单体存储电压

	u16 LiPoDchgCellVolt;			//LiPo放电单体截止电压
	u16 LiLoDchgCellVolt;			//LiLo放电单体截止电压
	u16 LiFeDchgCellVolt;			//LiFe放电单体截止电压

	u16 ChargeCurrent;				//设置充电电流
	u16 DischargeCurrent;			//设置放电电流

	u16 EndCharge;					//充电结束电流
	u16 EndDischarge;				//放电结束电流
	u16 RegDchgMode;				//放电模式: OFF(内部放电),回收到输入放电,回收到另外通道,自动回收

	u16 NiPeak;						// 镍电池敏感电压
	u16 NiPeakDelay;				// deltaV检测延迟

	u16 NiTrickleEnable;			//涓流充电允许
	u16 NiTrickleCurrent;			//涓流充电电流
	u16 NiTrickleTime;				//涓流充电时间

	u16 NiZeroEnable;				//Ni充电0电压允许(用于发射机中有二极管)
	
	u16 NiDischargeVolt;			//Ni放电电压
	u16 PbChgCellVolt;				//Pb电池单体充电电压
	u16 PbDchgCellVolt;				//Pb电池单体放电电压
	u16 PbFloatEnable;				//Pb电池单体浮充允许
	u16 PbFloatCellVolt;			//Pb电池单体浮充电压

	u16 RestoreVolt;				//低压恢复电压
	u16 RestoreTime;				//低压恢复时间
	u16 RestoreCurent;				//低压恢复电流
	//
	//循环控制
	u16 CycleCount;					//循环次数
	u16 CycleDelay;					//循环间隔时间
	u8 CycleMode;					//循环模式
	
	//安全条件
	u16 SafetyTimeC;				//安全时间
	u16	SafetyCapC;					//安全容量%
	u16 SafetyTempC;				//安全温度
	u16 SafetyTimeD;				//安全时间
	u16	SafetyCapD;					//安全容量%
	u16 SafetyTempD;				//安全温度

//#ifdef REG_CH
	u8 RegChMode;					//通道回收模式
	u16 RegChVolt;					//通道回收限制电压
	u16 RegChCurrent;				//通道回收限制电流
//#endif

//#ifdef FAST_STO
	u8 FastSto;						//快速锂电池存储	
	u16 StoCompensation;			//存储修正电压
//#endif

//#ifdef NIZN
	u16 NiZnChgCellVolt;			//NiZn电池单体充电电压
	u16 NiZnDchgCellVolt;			//NiZn放电单体截止电压
	u8 NiZnCell;					//NiZn电池串数
//#endif
	u8 Dump;		//很重要,整个结构长度要为双数,否则存储可能丢失最后的数据

}MEMORY;

#define NI_ZERO_VOLT		500	   //NI充电0电压检测标准

#define CAP_MIN				0
#define CAP_MAX				999900
#define CAP_STEP			100
#define CAP_DEFAULT			0

#define RUN_COUNT_MIN				0
#define RUN_COUNT_MAX				999
#define RUN_COUNT_STEP				1
#define RUN_COUNT_DEFAULT			0

#define LOG_INTERVAL_MIN				5
#define LOG_INTERVAL_MAX				600
#define LOG_INTERVAL_STEP				5
#define LOG_INTERVAL_DEFAULT			10

#define BT_TYPE_MIN				0
#define BT_TYPE_MAX				(BT_MAX-1)
#define BT_TYPE_STEP			1
#define BT_TYPE_DEFAULT			0

#define LI_CELLS_MIN	   0
#define LI_CELLS_MAX	   CELL_MAX
#define LI_CELLS_DEFAULT   0

#define NI_CELLS_MIN	   0
#define NI_CELLS_MAX	   HW_NI_CELLS_MAX
#define NI_CELLS_DEFAULT   0

#define PB_CELLS_MIN	   1
#define PB_CELLS_MAX	   HW_PB_CELLS_MAX
#define PB_CELLS_DEFAULT   6

#define RESTORE_VOLT_MIN		500  //低压恢复电压MIN
#define RESTORE_VOLT_MAX		2500  //低压恢复电压MAX
#define RESTORE_VOLT_DEFAULT	1000

#define RESTORE_TIME_MIN		1 //低压恢复时间MIN
#define RESTORE_TIME_MAX		5 //低压恢复时间MAX
#define RESTORE_TIME_DEFAULT	3

#define RESTORE_CURRENT_MIN		2  //低压恢复电流MIN
#define RESTORE_CURRENT_MAX		50	//低压恢复电流MAX
#define RESTORE_CURRENT_DEFAULT	10

//#ifdef NIZN
#define NIZN_CELLS_MIN		0
#define NIZN_CELLS_MAX		CELL_MAX
#define NIZN_CELLS_DEFAULT  0

#define NIZN_CHG_MIN		1200
#define NIZN_CHG_MAX		2000
#define NIZN_CHG_DEFAULT	1900

#define NIZN_DCHG_MIN		900
#define NIZN_DCHG_MAX		1600
#define NIZN_DCHG_DEFAULT	1100

#define NIZN_STD			1650
#define NIZN_MIN			RESTORE_VOLT_MIN
#define NIZN_MAX			(NIZN_CHG_MAX+50)
//#endif

//#define LITYPE_FE			2
#define LI_BAL_VOLT_MIN			3000
#define LI_BAL_VOLT_MAX			4200
#define LI_BAL_VOLT_DEFAULT		3500

#define LI_BAL_DIFF_MIN			1
#define LI_BAL_DIFF_MAX			10
#define LI_BAL_DIFF_DEFAULT		5

#define LI_BAL_SETPOINT_MIN			1
#define LI_BAL_SETPOINT_MAX			50
#define LI_BAL_SETPOINT_DEFAULT		5

#define LI_BAL_DELAY_MIN			0
#define LI_BAL_DELAY_MAX			20
#define LI_BAL_DELAY_DEFAULT		1

#define LI_BAL_OVER_MIN			0
#define LI_BAL_OVER_MAX			10
#define LI_BAL_OVER_DEFAULT		0

#define LIFE_CHG_MIN		3300
#define LIFE_CHG_MAX		3800
#define LIFE_CHG_DEFAULT	3600

#define LIFE_STO_MIN		3100
#define LIFE_STO_MAX		3400
#define LIFE_STO_DEFAULT	3300

#define LIFE_DCHG_MIN		2000
#define LIFE_DCHG_MAX		3500
#define LIFE_DCHG_DEFAULT	2500

#define LIFE_STD			3300
#define LIFE_MIN			RESTORE_VOLT_MIN
#define LIFE_MAX			(LIFE_CHG_MAX+50)

#define LIFE_ADJ_STEP		1

//#define LITYPE_LO			1
#define LIIO_CHG_MIN		3750
#define LIIO_CHG_MAX		4350
#define LIIO_CHG_DEFAULT	4100

#define LIIO_STO_MIN		3600
#define LIIO_STO_MAX		3800
#define LIIO_STO_DEFAULT	3750

#define LIIO_DCHG_MIN		2500
#define LIIO_DCHG_MAX		4000
#define LIIO_DCHG_DEFAULT	3500

#define LIIO_STD			3600
#define LIIO_MIN			RESTORE_VOLT_MIN
#define LIIO_MAX			(LIIO_CHG_MAX+50)

#define LIIO_ADJ_STEP		1

#define LIPO_CHG_MIN		3850
#define LIPO_CHG_MAX		4350
#define LIPO_CHG_DEFAULT	4200

#define LIPO_STO_MIN		3700
#define LIPO_STO_MAX		3900
#define LIPO_STO_DEFAULT	3850

#define LI_STO_COMP_MIN		0
#define LI_STO_COMP_MAX		200
#define LI_STO_COMP_DEFAULT	10

#define LIPO_DCHG_MIN		3000
#define LIPO_DCHG_MAX		4100
#define LIPO_DCHG_DEFAULT	3500

#define LIPO_STD			3700
#define LIPO_MIN			RESTORE_VOLT_MIN
#define LIPO_MAX			(LIPO_CHG_MAX+50)

#define LIPO_ADJ_STEP		1

#define NI_STD				1200

#define PB_STD				2000

#define PB_CHG_MIN			2000
#define PB_CHG_MAX			2600
#define PB_CHG_DEFAULT		2400

#define PB_FLOAT_MIN		2200
#define PB_FLOAT_MAX		2400
#define PB_FLOAT_DEFAULT	2300

#define PB_DCHG_MIN			1500
#define PB_DCHG_MAX			2400
#define PB_DCHG_DEFAULT		1800

#define PB_ADJ_STEP			1

#define MEM_EMPTY			0xffff
#define MEM_USED			0x55aa
#define MEM_FIXED			0x0000
#define MEM_SIZE			256

#define CYCLE_COUNT_MIN		1		//循环数MIN
#define CYCLE_COUNT_MAX		99 //循环数MAX
#define CYCLE_COUNT_DEFAULT	3

#define CYCLE_TIME_MIN		0		//循环间隔时间MIN
#define CYCLE_TIME_MAX		9999 //循环间隔时间MAX
#define CYCLE_TIME_DEFAULT	3

#define	SAFETY_TEMP_MIN		200	//安全温度MIN
#define	SAFETY_TEMP_MAX		800 //安全温度MAX
#define	SAFETY_TEMP_DEFAULT	450

#define	SAFETY_CAP_MIN		50	//安全容量MIN
#define	SAFETY_CAP_MAX		200 //安全容量MAX
#define	SAFETY_CAP_DEFAULT	120

#define	SAFETY_TIME_MIN		0	//安全时间MIN
#define	SAFETY_TIME_MAX		9999 //安全时间MAX
#define	SAFETY_TIME_DEFAULT	0

#define	END_CURRENT_C_MIN		1	//充电结束电流MIN
#define	END_CURRENT_C_MAX		50 	//充电结束电流MAX
#define	END_CURRENT_C_DEFAULT	10

#define	END_CURRENT_D_MIN		1	//放电结束电流MIN
#define	END_CURRENT_D_MAX		100 //放电结束电流MAX
#define	END_CURRENT_D_DEFAULT	50

#define END_CURRENT_STO_MAX	10		//存储的最大结束电流百分比

#define	CURRENT_MIN			5	//充放电电流MIN
#define	CURRENT_MAX			(SET_CURRENT_MAX) //充放电电流MAX
#define	CURRENT_DEFAULT		200
#define CURRENT_SYN_MAX		SET_ALL_CURRENT_MAX //同步模式充放电电流MAX

#define	VOLT_D_MIN 				100
#define	VOLT_D_MAX 				40000
#define	VOLT_D_DEFAULT			10

#define NI_PEAK_SENS_MIN		1
#define NI_PEAK_SENS_MAX		20
#define NIMH_PEAK_SENS_DEFAULT	3
#define NICD_PEAK_SENS_DEFAULT	5

#define NI_PEAK_DELAY_MIN		0
#define NI_PEAK_DELAY_MAX		20
#define NI_PEAK_DELAY_DEFAULT	3

#define NI_TRICKLE_CURRENT_MIN			2
#define NI_TRICKLE_CURRENT_MAX			100
#define NI_TRICKLE_CURRENT_DEFAULT		5

#define NI_TRICKLE_TIME_MIN			1
#define NI_TRICKLE_TIME_MAX			999
#define NI_TRICKLE_TIME_DEFAULT		5

#define BAL_DIFF_SLOW			3
#define BAL_POINT_SLOW			3
#define BAL_OVER_SLOW			0
#define BAL_DELAY_SLOW			2

#define BAL_DIFF_NORMAL			LI_BAL_DIFF_DEFAULT
#define BAL_POINT_NORMAL		LI_BAL_SETPOINT_DEFAULT
#define BAL_OVER_NORMAL			LI_BAL_OVER_DEFAULT	
#define BAL_DELAY_NORMAL		LI_BAL_DELAY_DEFAULT	

#define BAL_DIFF_FAST			8
#define BAL_POINT_FAST			8
#define BAL_OVER_FAST			5
#define BAL_DELAY_FAST			0

enum
{
	REG_CH_TYPE_RES,
	REG_CH_TYPE_BAT,
};
#define REG_CH_VOLT_DEFAULT		12000
#define REG_CH_CURRENT_DEFAULT	100

#define MEMORY_DEFAULT {															\
	MEM_USED,						/*使用标记*/									\
	{0},							/*程序名称*/									\
	CAP_DEFAULT,			/*标称容量*/									\
	0,								/*自动保存*/								\
	0,							/*Li电池平衡结束电流模式*/								\
	0xff,							/*程序锁定标记*/								\
	{0xff,0xff,0xff,0xff,0xff,0xff},			/*程序锁定密码*/								\
	0xffff,							/*模块是否使用*/								\
	0,								/*输出通道选择*/								\
	1,								/*=0:不输出log到SD =1:输出log到SD*/				\
	LOG_INTERVAL_DEFAULT,			/*采样间隔0.1S为1个单位*/						\
	RUN_COUNT_DEFAULT,								/*运行次数统计*/								\
	BT_TYPE_DEFAULT,								/*类型: LiPo,LiLo,LiFe,NiMH,Nicd,Pb*/			\
	LI_CELLS_DEFAULT,								/*Li电池串数*/									\
	NI_CELLS_DEFAULT,								/*Ni电池串数*/									\
	PB_CELLS_DEFAULT,								/*Pb电池串数*/									\
	LI_MODE_C_BAL,					/*Li冲电模式:Not Balance,Balance*/			\
	0,								/*Li放电模式: Normal,Balance,External*/						\
	NI_MODE_C_NORMAL,				/*Ni冲电模式*/									\
	0,								/*Ni放电模式*/									\
	0,								/*Pb冲电模式*/									\
	0,								/*Pb放电模式*/									\
	BAL_SPEED_NORMAL,		/*平衡速度*/  \
	BAL_START_CV_200,							/*平衡起始模式*/									\
	LI_BAL_VOLT_DEFAULT,			/*平衡起始电压*/								\
	LI_BAL_DIFF_DEFAULT,			/*平衡停止精度(mV)*/							\
	LI_BAL_OVER_DEFAULT,			/*平衡器过充(mV)*/							\
	LI_BAL_SETPOINT_DEFAULT,		/*平衡充电结束时的最低压差与设置值*/			\
	LI_BAL_DELAY_DEFAULT,			/*平衡推迟结束时间*/							\
	0,								/*续冲*/										\
	LIPO_CHG_DEFAULT,				/*LiPo电池单体充电电压*/						\
	LIIO_CHG_DEFAULT,				/*LiLo电池单体充电电压*/						\
	LIFE_CHG_DEFAULT,				/*LiFe电池单体充电电压*/						\
	LIPO_STO_DEFAULT,				/*LiPo电池单体存储电压*/						\
	LIIO_STO_DEFAULT,				/*LiLo电池单体存储电压*/						\
	LIFE_STO_DEFAULT,				/*LiFe电池单体存储电压*/						\
	LIPO_DCHG_DEFAULT,				/*LiPo放电单体截止电压*/						\
	LIIO_DCHG_DEFAULT,				/*LiLo放电单体截止电压*/						\
	LIFE_DCHG_DEFAULT,				/*LiFe放电单体截止电压*/						\
	CURRENT_DEFAULT,				/*设置充电电流*/								\
	CURRENT_DEFAULT,				/*设置放电电流*/								\
	END_CURRENT_C_DEFAULT,			/*EndCharge充电结束电流*/						\
	END_CURRENT_D_DEFAULT,			/*EndDischarge放电结束电流*/					\
	REG_DCHG_OFF,					/*RegDchgMode放电模式*/							\
	NIMH_PEAK_SENS_DEFAULT,			/*镍电池敏感电压*/								\
	NI_PEAK_DELAY_DEFAULT,			/*deltaV检测延迟*/								\
	0,								/*涓流充电允许*/								\
	NI_TRICKLE_CURRENT_DEFAULT,		/*涓流充电电流*/								\
	NI_TRICKLE_TIME_DEFAULT,		/*涓流充电时间*/								\
	0,								/*Ni充电0电压允许(用于发射机中有二极管)*/		\
	VOLT_D_DEFAULT,					/*NiMH放电电压*/								\
	PB_CHG_DEFAULT,					/*Pb电池单体充电电压*/							\
	PB_DCHG_DEFAULT,				/*Pb电池单体放电电压*/							\
	0,								/*Pb电池单体浮充允许*/							\
	PB_FLOAT_DEFAULT,				/*Pb电池单体浮充电压*/							\
	RESTORE_VOLT_DEFAULT,			/*低压恢复电压*/								\
	RESTORE_TIME_DEFAULT,			/*低压恢复时间*/								\
	RESTORE_CURRENT_DEFAULT,		/*低压恢复电流*/								\
	CYCLE_COUNT_DEFAULT,			/*循环次数*/									\
	CYCLE_TIME_DEFAULT,				/*循环间隔时间*/								\
	CYCLE_MODE_C2D,					/*循环模式*/									\
	SAFETY_TIME_DEFAULT,			/*安全时间*/									\
	SAFETY_CAP_DEFAULT,				/*安全容量*/									\
	SAFETY_TEMP_DEFAULT,			/*安全温度*/									\
	SAFETY_TIME_DEFAULT,			/*安全时间*/									\
	SAFETY_CAP_DEFAULT,				/*安全容量*/									\
	SAFETY_TEMP_DEFAULT,			/*安全温度*/									\
	REG_CH_TYPE_RES,				/*通道回收模式*/								\
	REG_CH_VOLT_DEFAULT,			/*通道回收限制电压*/							\
	REG_CH_CURRENT_DEFAULT,			/*通道回收限制电流*/							\
	1,								/*快速锂电池存储*/								\
	LI_STO_COMP_DEFAULT,			/*存储补偿电压*/								\
	NIZN_CHG_DEFAULT,			/*NiZn电池单体充电电压*/							\
	NIZN_DCHG_DEFAULT,			/*NiZn放电单体截止电压*/							\
	NIZN_CELLS_DEFAULT,			/*NiZn电池串数*/									\
	0xff,										/*凑双数据*/		\
}


#endif //MEMSTRUCT

