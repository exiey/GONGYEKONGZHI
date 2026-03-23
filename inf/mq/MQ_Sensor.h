#ifndef __MQ_SENSOR_H
#define __MQ_SENSOR_H
#include <math.h>
#include <stdio.h>

#include "stm32f1xx_hal.h"  // 间接包含stm32f1xx_hal_cortex.h
#include "adc.h"


float GetMQ8Out(void);
float GetMQ135Out(void);
float GetMQ136Out(void);
float GetMQ137Out(void);
float GetMQ138Out(void);

#endif