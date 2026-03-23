#include "dht11.h"
#include "tim.h"

extern TIM_HandleTypeDef htim3;

void DHT11_Delay_us(uint16_t us)
{
    __HAL_TIM_SET_COUNTER(&htim3, 0);
    while (__HAL_TIM_GET_COUNTER(&htim3) < us) {
    }
}

void DHT11_Rst(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    GPIO_InitStruct.Pin = DHT11_GPIO_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

    HAL_GPIO_WritePin(DHT11_GPIO_PORT, DHT11_GPIO_PIN, GPIO_PIN_RESET);
    HAL_Delay(20);
    HAL_GPIO_WritePin(DHT11_GPIO_PORT, DHT11_GPIO_PIN, GPIO_PIN_SET);
    DHT11_Delay_us(30);
}

uint8_t DHT11_Check(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    uint8_t retry = 0;

    GPIO_InitStruct.Pin = DHT11_GPIO_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

    while (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) && retry < 100) {
        retry++;
        DHT11_Delay_us(1);
    }
    if (retry >= 100) {
        return 1;
    }

    retry = 0;
    while (!HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) && retry < 100) {
        retry++;
        DHT11_Delay_us(1);
    }
    if (retry >= 100) {
        return 1;
    }

    return 0;
}

uint8_t DHT11_Read_Bit(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    uint8_t retry = 0;

    GPIO_InitStruct.Pin = DHT11_GPIO_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

    while (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) && retry < 100) {
        retry++;
        DHT11_Delay_us(1);
    }

    retry = 0;
    while (!HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) && retry < 100) {
        retry++;
        DHT11_Delay_us(1);
    }

    DHT11_Delay_us(40);
    return HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) ? 1U : 0U;
}

uint8_t DHT11_Read_Byte(void)
{
    uint8_t i;
    uint8_t dat = 0;

    for (i = 0; i < 8; i++) {
        dat <<= 1;
        dat |= DHT11_Read_Bit();
    }
    return dat;
}

uint8_t DHT11_Read_Data(uint8_t *temp, uint8_t *humi)
{
    uint8_t buf[5];
    uint8_t i;

    DHT11_Rst();
    if (DHT11_Check() == 0U) {
        for (i = 0; i < 5; i++) {
            buf[i] = DHT11_Read_Byte();
        }

        if ((uint8_t)(buf[0] + buf[1] + buf[2] + buf[3]) == buf[4]) {
            *humi = buf[0];
            *temp = buf[2];
        }
        return 0;
    }
    return 1;
}

uint8_t DHT11_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    __HAL_RCC_GPIOA_CLK_ENABLE();

    GPIO_InitStruct.Pin = DHT11_GPIO_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

    HAL_GPIO_WritePin(DHT11_GPIO_PORT, DHT11_GPIO_PIN, GPIO_PIN_SET);
    HAL_Delay(10);

    DHT11_Rst();
    return DHT11_Check();
}
