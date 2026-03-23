 /**
 * @file tm_user.c
 * @brief 物模型用户接口定义文件
 * @details 该文件由物联网平台根据用户配置的物模型自动生成，包含设备服务、属性、命令和事件的接口定义。
 *          用户需实现文件中声明的回调函数，以处理物模型数据的读写、命令执行和事件上报等操作。
 * @author 中移物联网有限公司
 * @date 2025-06-13
 * @version V1.0
 * @copyright Copyright © 2024 中移物联网有限公司. All rights reserved.
 */

/*****************************************************************************/
/* Includes                                                                  */
/*****************************************************************************/
#include "tm_data.h"
#include "tm_user.h"

/*****************************************************************************/
/* Local Definitions ( Constant and Macro )                                  */
/*****************************************************************************/

/*****************************************************************************/
/* Structures, Enum and Typedefs                                             */
/*****************************************************************************/
/*************************** Property Func List ******************************/
struct tm_prop_tbl_t tm_prop_list[] = {
    TM_PROPERTY_RO(CollectionEquipmentStatus),
    TM_PROPERTY_RW(flame),
    TM_PROPERTY_RW(humidity),
    TM_PROPERTY_RW(posture),
    TM_PROPERTY_RW(red),
    TM_PROPERTY_RW(smoke),
    TM_PROPERTY_RW(temperature)
};
uint16_t tm_prop_list_size = ARRAY_SIZE(tm_prop_list);
/****************************** Auto Generated *******************************/

/***************************** Service Func List *******************************/
struct tm_svc_tbl_t tm_svc_list[] = {0};
uint16_t tm_svc_list_size = 0;
/****************************** Auto Generated *******************************/

/*****************************************************************************/
/* Local Function Prototype                                                  */
/*****************************************************************************/

/*****************************************************************************/
/* Local Variables                                                           */
/*****************************************************************************/

/*****************************************************************************/
/* Global Variables                                                          */
/*****************************************************************************/

/*****************************************************************************/
/* Function Implementation                                                   */
/*****************************************************************************/
/**************************** Property Func Read *****************************/
int32_t tm_prop_CollectionEquipmentStatus_rd_cb(void *data)
{
	int32_t val = 0;

	/** 根据业务逻辑获取功能点值，设置到val */


	tm_data_struct_set_enum(data, "CollectionEquipmentStatus", val);

	return 0;
}

int32_t tm_prop_flame_rd_cb(void *data)
{
	boolean val = 0;
	/** 根据业务逻辑获取功能点值，设置到val */


	tm_data_struct_set_bool(data, "flame", val);

	return 0;
}

int32_t tm_prop_humidity_rd_cb(void *data)
{
	float32_t val = 0;

	/** 根据业务逻辑获取功能点值，设置到val */


	tm_data_struct_set_float(data, "humidity", val);

	return 0;
}

int32_t tm_prop_posture_rd_cb(void *data)
{
    void *structure = tm_data_struct_create();
    struct prop_posture_t val = {0};
    /** 根据业务逻辑获取功能点值，设置到val */

    tm_data_struct_set_float(structure, "pitch", val.pitch);
    tm_data_struct_set_float(structure, "roll", val.roll);
    tm_data_struct_set_float(structure, "yaw", val.yaw);
    tm_data_struct_set_data(data, "posture", structure);
   return 0;
}

int32_t tm_prop_red_rd_cb(void *data)
{
	boolean val = 0;
	/** 根据业务逻辑获取功能点值，设置到val */


	tm_data_struct_set_bool(data, "red", val);

	return 0;
}

int32_t tm_prop_smoke_rd_cb(void *data)
{
	boolean val = 0;
	/** 根据业务逻辑获取功能点值，设置到val */


	tm_data_struct_set_bool(data, "smoke", val);

	return 0;
}

int32_t tm_prop_temperature_rd_cb(void *data)
{
	float32_t val = 0;

	/** 根据业务逻辑获取功能点值，设置到val */


	tm_data_struct_set_float(data, "temperature", val);

	return 0;
}


/****************************** Auto Generated *******************************/

/**************************** Property Func Write ****************************/
int32_t tm_prop_flame_wr_cb(void *data)
{
    boolean val = 0;
    tm_data_get_bool(data, &val);
    /** 根据变量val的值，填入下发控制逻辑 */

    /***/
    return 0;
}

int32_t tm_prop_humidity_wr_cb(void *data)
{
    float32_t val = 0;
    tm_data_get_float(data, &val);
    /** 根据变量val的值，填入下发控制逻辑 */

    /***/
    return 0;
}

int32_t tm_prop_posture_wr_cb(void *data)
{
    struct prop_posture_t val;

    tm_data_struct_get_float(data, "pitch", &(val.pitch));
    tm_data_struct_get_float(data, "roll", &(val.roll));
    tm_data_struct_get_float(data, "yaw", &(val.yaw));
    /** 根据变量val的值，填入下发控制逻辑 */

    /***/
    return 0;
}

int32_t tm_prop_red_wr_cb(void *data)
{
    boolean val = 0;
    tm_data_get_bool(data, &val);
    /** 根据变量val的值，填入下发控制逻辑 */

    /***/
    return 0;
}

int32_t tm_prop_smoke_wr_cb(void *data)
{
    boolean val = 0;
    tm_data_get_bool(data, &val);
    /** 根据变量val的值，填入下发控制逻辑 */

    /***/
    return 0;
}

int32_t tm_prop_temperature_wr_cb(void *data)
{
    float32_t val = 0;
    tm_data_get_float(data, &val);
    /** 根据变量val的值，填入下发控制逻辑 */

    /***/
    return 0;
}


/****************************** Auto Generated *******************************/

/**************************** Property Func Notify ***************************/
int32_t tm_prop_CollectionEquipmentStatus_notify(void *data, int32_t val, uint64_t timestamp, uint32_t timeout_ms)
{
	void *resource = NULL;
    int32_t ret = 0;

    if(NULL == data)
    {
        resource = tm_data_create();
    }
    else
    {
        resource = data;
    }

    tm_data_set_enum(resource, "CollectionEquipmentStatus", val, timestamp);

    if(NULL == data)
    {
        ret = tm_post_property(resource, timeout_ms);
    }

    return ret;
}

int32_t tm_prop_flame_notify(void *data, boolean val, uint64_t timestamp, uint32_t timeout_ms)
{
	void *resource = NULL;
    int32_t ret = 0;

    if(NULL == data)
    {
        resource = tm_data_create();
    }
    else
    {
        resource = data;
    }

    tm_data_set_bool(resource, "flame", val, timestamp);

    if(NULL == data)
    {
        ret = tm_post_property(resource, timeout_ms);
    }

    return ret;
}

int32_t tm_prop_humidity_notify(void *data, float32_t val, uint64_t timestamp, uint32_t timeout_ms)
{
	void *resource = NULL;
    int32_t ret = 0;

    if(NULL == data)
    {
        resource = tm_data_create();
    }
    else
    {
        resource = data;
    }

    tm_data_set_float(resource, "humidity", val, timestamp);

    if(NULL == data)
    {
        ret = tm_post_property(resource, timeout_ms);
    }

    return ret;
}

int32_t tm_prop_posture_notify(void *data, struct prop_posture_t val, uint64_t timestamp, uint32_t timeout_ms)
{
    void *resource = NULL;
    void *structure = tm_data_struct_create();
	int32_t ret = 0;

    if(NULL == data)
    {
        resource = tm_data_create();
    }
    else
    {
        resource = data;
    }

	tm_data_struct_set_float(structure, "pitch", val.pitch);

	tm_data_struct_set_float(structure, "roll", val.roll);

	tm_data_struct_set_float(structure, "yaw", val.yaw);

    tm_data_set_struct(resource, "posture", structure, timestamp);

    if(NULL == data)
    {
        ret = tm_post_property(resource, timeout_ms);
    }

    return ret;
}

int32_t tm_prop_red_notify(void *data, boolean val, uint64_t timestamp, uint32_t timeout_ms)
{
	void *resource = NULL;
    int32_t ret = 0;

    if(NULL == data)
    {
        resource = tm_data_create();
    }
    else
    {
        resource = data;
    }

    tm_data_set_bool(resource, "red", val, timestamp);

    if(NULL == data)
    {
        ret = tm_post_property(resource, timeout_ms);
    }

    return ret;
}

int32_t tm_prop_smoke_notify(void *data, boolean val, uint64_t timestamp, uint32_t timeout_ms)
{
	void *resource = NULL;
    int32_t ret = 0;

    if(NULL == data)
    {
        resource = tm_data_create();
    }
    else
    {
        resource = data;
    }

    tm_data_set_bool(resource, "smoke", val, timestamp);

    if(NULL == data)
    {
        ret = tm_post_property(resource, timeout_ms);
    }

    return ret;
}

int32_t tm_prop_temperature_notify(void *data, float32_t val, uint64_t timestamp, uint32_t timeout_ms)
{
	void *resource = NULL;
    int32_t ret = 0;

    if(NULL == data)
    {
        resource = tm_data_create();
    }
    else
    {
        resource = data;
    }

    tm_data_set_float(resource, "temperature", val, timestamp);

    if(NULL == data)
    {
        ret = tm_post_property(resource, timeout_ms);
    }

    return ret;
}


/****************************** Auto Generated *******************************/

/***************************** Event Func Notify *****************************/

/****************************** Auto Generated *******************************/

/**************************** Service Func Invoke ****************************/

/****************************** Auto Generated *******************************/
