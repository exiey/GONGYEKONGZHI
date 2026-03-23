#include "dht11.h"

// 全局变量引用(TIM3已在main中初始化)
extern TIM_HandleTypeDef htim3;

/**
 * @brief  微秒延时函数(基于TIM2)
 * @param  us: 延时微秒数(最大支持65535us)
 */
void DHT11_Delay_us(uint16_t us)
{
    __HAL_TIM_SET_COUNTER(&htim3, 0);  // 重置定时器计数器
    while (__HAL_TIM_GET_COUNTER(&htim3) < us);  // 等待计数器达到指定值
}

/**
 * @brief  复位DHT11传感器
 */
void DHT11_Rst(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    // 配置为输出模式
    GPIO_InitStruct.Pin = DHT11_GPIO_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

    // 拉低总线至少18ms
    HAL_GPIO_WritePin(DHT11_GPIO_PORT, DHT11_GPIO_PIN, GPIO_PIN_RESET);
    HAL_Delay(20);

    // 拉高总线20-40us
    HAL_GPIO_WritePin(DHT11_GPIO_PORT, DHT11_GPIO_PIN, GPIO_PIN_SET);
    DHT11_Delay_us(30);
}

/**
 * @brief  检测DHT11传感器是否存在
 * @retval 0: 存在 1: 不存在
 */
uint8_t DHT11_Check(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    uint8_t retry = 0;

    // 配置为输入模式
    GPIO_InitStruct.Pin = DHT11_GPIO_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

    // 等待DHT11拉低总线(40-80us)
    while (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) && retry < 100)
    {
        retry++;
        DHT11_Delay_us(1);
    }
    if (retry >= 100) return 1;

    // 等待DHT11拉高总线(40-80us)
    retry = 0;
    while (!HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) && retry < 100)
    {
        retry++;
        DHT11_Delay_us(1);
    }
    if (retry >= 100) return 1;

    return 0;  // 检测到DHT11
}

/**
 * @brief  从DHT11读取一个位
 * @retval 读取到的位值(0或1)
 */
uint8_t DHT11_Read_Bit(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    uint8_t retry = 0;

    // 配置为输入模式
    GPIO_InitStruct.Pin = DHT11_GPIO_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

    // 等待总线拉低
    while (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) && retry < 100)
    {
        retry++;
        DHT11_Delay_us(1);
    }
    retry = 0;

    // 等待总线拉高
    while (!HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN) && retry < 100)
    {
        retry++;
        DHT11_Delay_us(1);
    }

    // 延时40us后判断电平状态
    DHT11_Delay_us(40);
    if (HAL_GPIO_ReadPin(DHT11_GPIO_PORT, DHT11_GPIO_PIN))
        return 1;  // 高电平表示1
    else
        return 0;  // 低电平表示0
}

/**
 * @brief  从DHT11读取一个字节
 * @retval 读取到的字节数据
 */
uint8_t DHT11_Read_Byte(void)
{
    uint8_t i, dat = 0;
    for (i = 0; i < 8; i++)
    {
        dat <<= 1;
        dat |= DHT11_Read_Bit();
    }
    return dat;
}

/**
 * @brief  从DHT11读取温湿度数据
 * @param  temp: 温度数据指针
 * @param  humi: 湿度数据指针
 * @retval 0: 读取成功 1: 读取失败
 */
uint8_t DHT11_Read_Data(uint8_t *temp, uint8_t *humi)
{
    uint8_t buf[5];
    uint8_t i;

    DHT11_Rst();                  // 复位传感器
    if (DHT11_Check() == 0)       // 检测到传感器
    {
        for (i = 0; i < 5; i++)   // 读取40位数据
        {
            buf[i] = DHT11_Read_Byte();
        }

        // 校验数据
        if ((buf[0] + buf[1] + buf[2] + buf[3]) == buf[4])
        {
            *humi = buf[0];       // 湿度整数部分
            *temp = buf[2];       // 温度整数部分
        }
        return 0;  // 读取成功
    }
    return 1;      // 读取失败
}

/**
 * @brief  初始化DHT11传感器
 * @retval 0: 初始化成功 1: 初始化失败
 */
uint8_t DHT11_Init(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    // 使能GPIOA时钟
    __HAL_RCC_GPIOA_CLK_ENABLE();

    // 初始化为输出模式
    GPIO_InitStruct.Pin = DHT11_GPIO_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(DHT11_GPIO_PORT, &GPIO_InitStruct);

    // 初始拉高总线
    HAL_GPIO_WritePin(DHT11_GPIO_PORT, DHT11_GPIO_PIN, GPIO_PIN_SET);
    HAL_Delay(10);

    // 复位并检测传感器
    DHT11_Rst();
    return DHT11_Check();
}
