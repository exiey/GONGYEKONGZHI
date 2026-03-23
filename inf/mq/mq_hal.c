#include "mq_hal.h"
#include "stm32f1xx_hal.h"

// 全局变量
extern ADC_HandleTypeDef hadc1;

// 读取MQ-8传感器值
float GetMQ8Out(void)
{
    uint16_t adc_value = 0;
    float voltage = 0;

    // 启动ADC转换
    HAL_ADC_Start(&hadc1);
    // 等待转换完成
    HAL_ADC_PollForConversion(&hadc1, 100);
    // 读取ADC值
    adc_value = HAL_ADC_GetValue(&hadc1);
    // 停止ADC转换
    HAL_ADC_Stop(&hadc1);

    // 计算电压值 (3.3V参考电压)
    voltage = (float)adc_value * 3.3 / 4096;

    return voltage;
}

// 读取MQ-135传感器值
float GetMQ135Out(void)
{
    uint16_t adc_value = 0;
    float voltage = 0;

    // 启动ADC转换
    HAL_ADC_Start(&hadc1);
    // 等待转换完成
    HAL_ADC_PollForConversion(&hadc1, 100);
    // 读取ADC值
    adc_value = HAL_ADC_GetValue(&hadc1);
    // 停止ADC转换
    HAL_ADC_Stop(&hadc1);

    // 计算电压值 (3.3V参考电压)
    voltage = (float)adc_value * 3.3 / 4096;

    return voltage;
}

// 读取MQ-7传感器值
float GetMQ7Out(void)
{
    uint16_t adc_value = 0;
    float voltage = 0;

    // 启动ADC转换
    HAL_ADC_Start(&hadc1);
    // 等待转换完成
    HAL_ADC_PollForConversion(&hadc1, 100);
    // 读取ADC值
    adc_value = HAL_ADC_GetValue(&hadc1);
    // 停止ADC转换
    HAL_ADC_Stop(&hadc1);

    // 计算电压值 (3.3V参考电压)
    voltage = (float)adc_value * 3.3 / 4096;

    return voltage;
}