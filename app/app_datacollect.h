//
// Created by 13161 on 25-10-15.
//

#ifndef APP_DATACOLLECT_H
#define APP_DATACOLLECT_H

#include "adc.h"
#include "gpio.h"
#include "dht11.h"
#include "Common_Debug.h"
#include "tim.h"

typedef struct{
    int status;
    int vibration;
    uint8_t temperature;
    uint8_t humidity;
    int smoke;
    float smoke_voltage;
    uint8_t red;
    uint8_t flame;
    float pitch;
    float roll;
    float yaw;
}cgq_data;

/**
 *初始化采集模块
 */
void app_collect_init();

/**
 *adc震动传感器数据
 */
void app_collect_vibration();

/**
 *adc震动传感器跳变
 */
void app_collect_vibration_jump();

/**
 *gpio采集温湿度传感器数据
 */
void app_collect_dht11();

/**
 * 获取当前采集快照
 */
void app_collect_get_snapshot(cgq_data *out);

#endif //APP_DATACOLLECT_H
