#include "app_datacollect.h"

#include <math.h>
#include <string.h>

#include "FreeRTOS.h"
#include "task.h"

#define MPU6050_ADDR_WRITE 0xD0U
#define MPU6050_ADDR_READ  0xD1U
#define MPU6050_REG_PWR_MGMT_1 0x6BU
#define MPU6050_REG_SMPLRT_DIV 0x19U
#define MPU6050_REG_CONFIG 0x1AU
#define MPU6050_REG_GYRO_CONFIG 0x1BU
#define MPU6050_REG_ACCEL_CONFIG 0x1CU
#define MPU6050_REG_ACCEL_XOUT_H 0x3BU

static cgq_data value;
static uint8_t dht11_init_ok;
static uint8_t mpu6050_init_ok;

static void mpu6050_i2c_delay_us(uint16_t us)
{
    uint32_t start = __HAL_TIM_GET_COUNTER(&htim3);

    while ((uint16_t)(__HAL_TIM_GET_COUNTER(&htim3) - start) < us) {
    }
}

static void mpu6050_sda_output(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    GPIO_InitStruct.Pin = MPU6050_SDA_Pin;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(MPU6050_SDA_GPIO_Port, &GPIO_InitStruct);
}

static void mpu6050_sda_input(void)
{
    GPIO_InitTypeDef GPIO_InitStruct = {0};

    GPIO_InitStruct.Pin = MPU6050_SDA_Pin;
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    HAL_GPIO_Init(MPU6050_SDA_GPIO_Port, &GPIO_InitStruct);
}

static void mpu6050_i2c_set_scl(GPIO_PinState state)
{
    HAL_GPIO_WritePin(MPU6050_SCL_GPIO_Port, MPU6050_SCL_Pin, state);
    mpu6050_i2c_delay_us(4);
}

static void mpu6050_i2c_set_sda(GPIO_PinState state)
{
    HAL_GPIO_WritePin(MPU6050_SDA_GPIO_Port, MPU6050_SDA_Pin, state);
    mpu6050_i2c_delay_us(4);
}

static void mpu6050_i2c_start(void)
{
    mpu6050_sda_output();
    mpu6050_i2c_set_sda(GPIO_PIN_SET);
    mpu6050_i2c_set_scl(GPIO_PIN_SET);
    mpu6050_i2c_set_sda(GPIO_PIN_RESET);
    mpu6050_i2c_set_scl(GPIO_PIN_RESET);
}

static void mpu6050_i2c_stop(void)
{
    mpu6050_sda_output();
    mpu6050_i2c_set_scl(GPIO_PIN_RESET);
    mpu6050_i2c_set_sda(GPIO_PIN_RESET);
    mpu6050_i2c_set_scl(GPIO_PIN_SET);
    mpu6050_i2c_set_sda(GPIO_PIN_SET);
}

static uint8_t mpu6050_i2c_wait_ack(void)
{
    uint16_t retry = 0U;

    mpu6050_sda_input();
    mpu6050_i2c_set_sda(GPIO_PIN_SET);
    mpu6050_i2c_set_scl(GPIO_PIN_SET);

    while ((HAL_GPIO_ReadPin(MPU6050_SDA_GPIO_Port, MPU6050_SDA_Pin) == GPIO_PIN_SET) && (retry < 100U)) {
        retry++;
        mpu6050_i2c_delay_us(2);
    }

    mpu6050_i2c_set_scl(GPIO_PIN_RESET);
    mpu6050_sda_output();
    return (retry < 100U) ? 0U : 1U;
}

static void mpu6050_i2c_ack(void)
{
    mpu6050_sda_output();
    mpu6050_i2c_set_scl(GPIO_PIN_RESET);
    mpu6050_i2c_set_sda(GPIO_PIN_RESET);
    mpu6050_i2c_set_scl(GPIO_PIN_SET);
    mpu6050_i2c_set_scl(GPIO_PIN_RESET);
}

static void mpu6050_i2c_nack(void)
{
    mpu6050_sda_output();
    mpu6050_i2c_set_scl(GPIO_PIN_RESET);
    mpu6050_i2c_set_sda(GPIO_PIN_SET);
    mpu6050_i2c_set_scl(GPIO_PIN_SET);
    mpu6050_i2c_set_scl(GPIO_PIN_RESET);
}

static void mpu6050_i2c_write_byte(uint8_t byte)
{
    uint8_t bit;

    mpu6050_sda_output();
    for (bit = 0U; bit < 8U; bit++) {
        mpu6050_i2c_set_scl(GPIO_PIN_RESET);
        mpu6050_i2c_set_sda((byte & 0x80U) ? GPIO_PIN_SET : GPIO_PIN_RESET);
        byte <<= 1;
        mpu6050_i2c_set_scl(GPIO_PIN_SET);
    }
    mpu6050_i2c_set_scl(GPIO_PIN_RESET);
}

static uint8_t mpu6050_i2c_read_byte(uint8_t ack)
{
    uint8_t bit;
    uint8_t byte = 0U;

    mpu6050_sda_input();
    for (bit = 0U; bit < 8U; bit++) {
        byte <<= 1;
        mpu6050_i2c_set_scl(GPIO_PIN_RESET);
        mpu6050_i2c_set_scl(GPIO_PIN_SET);
        if (HAL_GPIO_ReadPin(MPU6050_SDA_GPIO_Port, MPU6050_SDA_Pin) == GPIO_PIN_SET) {
            byte |= 0x01U;
        }
    }
    mpu6050_i2c_set_scl(GPIO_PIN_RESET);

    if (ack != 0U) {
        mpu6050_i2c_ack();
    } else {
        mpu6050_i2c_nack();
    }

    return byte;
}

static int mpu6050_write_reg(uint8_t reg, uint8_t data)
{
    mpu6050_i2c_start();
    mpu6050_i2c_write_byte(MPU6050_ADDR_WRITE);
    if (mpu6050_i2c_wait_ack() != 0U) {
        mpu6050_i2c_stop();
        return -1;
    }

    mpu6050_i2c_write_byte(reg);
    if (mpu6050_i2c_wait_ack() != 0U) {
        mpu6050_i2c_stop();
        return -1;
    }

    mpu6050_i2c_write_byte(data);
    if (mpu6050_i2c_wait_ack() != 0U) {
        mpu6050_i2c_stop();
        return -1;
    }

    mpu6050_i2c_stop();
    return 0;
}

static int mpu6050_read_regs(uint8_t reg, uint8_t *buf, uint8_t len)
{
    uint8_t i;

    if ((buf == NULL) || (len == 0U)) {
        return -1;
    }

    mpu6050_i2c_start();
    mpu6050_i2c_write_byte(MPU6050_ADDR_WRITE);
    if (mpu6050_i2c_wait_ack() != 0U) {
        mpu6050_i2c_stop();
        return -1;
    }

    mpu6050_i2c_write_byte(reg);
    if (mpu6050_i2c_wait_ack() != 0U) {
        mpu6050_i2c_stop();
        return -1;
    }

    mpu6050_i2c_start();
    mpu6050_i2c_write_byte(MPU6050_ADDR_READ);
    if (mpu6050_i2c_wait_ack() != 0U) {
        mpu6050_i2c_stop();
        return -1;
    }

    for (i = 0U; i < len; i++) {
        buf[i] = mpu6050_i2c_read_byte((i + 1U) < len ? 1U : 0U);
    }

    mpu6050_i2c_stop();
    return 0;
}

static int mpu6050_init(void)
{
    if (mpu6050_write_reg(MPU6050_REG_PWR_MGMT_1, 0x00U) != 0) {
        return -1;
    }
    if (mpu6050_write_reg(MPU6050_REG_SMPLRT_DIV, 0x07U) != 0) {
        return -1;
    }
    if (mpu6050_write_reg(MPU6050_REG_CONFIG, 0x06U) != 0) {
        return -1;
    }
    if (mpu6050_write_reg(MPU6050_REG_GYRO_CONFIG, 0x18U) != 0) {
        return -1;
    }
    if (mpu6050_write_reg(MPU6050_REG_ACCEL_CONFIG, 0x01U) != 0) {
        return -1;
    }
    return 0;
}

static void app_collect_mpu6050(void)
{
    uint8_t raw[14];
    int16_t ax;
    int16_t ay;
    int16_t az;
    int16_t gz;
    float accel_pitch;
    float accel_roll;
    static TickType_t last_tick;

    if (mpu6050_init_ok == 0U) {
        return;
    }

    if (mpu6050_read_regs(MPU6050_REG_ACCEL_XOUT_H, raw, sizeof(raw)) != 0) {
        value.status = 0;
        return;
    }

    ax = (int16_t)((raw[0] << 8) | raw[1]);
    ay = (int16_t)((raw[2] << 8) | raw[3]);
    az = (int16_t)((raw[4] << 8) | raw[5]);
    gz = (int16_t)((raw[12] << 8) | raw[13]);

    accel_pitch = atan2f((float)ay, sqrtf(((float)ax * (float)ax) + ((float)az * (float)az))) * 57.29578f;
    accel_roll = atan2f(-(float)ax, (float)az) * 57.29578f;

    if (last_tick == 0U) {
        value.pitch = accel_pitch;
        value.roll = accel_roll;
        value.yaw = 0.0f;
    } else {
        float dt = (float)(xTaskGetTickCount() - last_tick) / 1000.0f;
        float gyro_z_dps = (float)gz / 16.4f;

        value.pitch = (value.pitch * 0.96f) + (accel_pitch * 0.04f);
        value.roll = (value.roll * 0.96f) + (accel_roll * 0.04f);
        value.yaw += gyro_z_dps * dt;
        if (value.yaw > 180.0f) {
            value.yaw -= 360.0f;
        } else if (value.yaw < -180.0f) {
            value.yaw += 360.0f;
        }
    }

    value.vibration = (int)(fabsf(accel_pitch) + fabsf(accel_roll));
    value.status = 1;
    last_tick = xTaskGetTickCount();
}

void app_collect_init()
{
    memset(&value, 0, sizeof(value));
    value.status = 0;
    USART1_DebugWrite("COLLECT: init enter\r\n");

    USART1_DebugWrite("COLLECT: start TIM3\r\n");
    HAL_TIM_Base_Start(&htim3);
    USART1_DebugWrite("COLLECT: TIM3 ok\r\n");

    USART1_DebugWrite("COLLECT: adc calib\r\n");
    HAL_ADCEx_Calibration_Start(&hadc1);
    USART1_DebugWrite("COLLECT: adc calib ok\r\n");

    USART1_DebugWrite("COLLECT: adc ready\r\n");

    mpu6050_sda_output();
    HAL_GPIO_WritePin(MPU6050_SCL_GPIO_Port, MPU6050_SCL_Pin, GPIO_PIN_SET);
    HAL_GPIO_WritePin(MPU6050_SDA_GPIO_Port, MPU6050_SDA_Pin, GPIO_PIN_SET);
    USART1_DebugWrite("COLLECT: mpu gpio ok\r\n");

    HAL_Delay(50);
    USART1_DebugWrite("COLLECT: mpu init begin\r\n");
    mpu6050_init_ok = (mpu6050_init() == 0) ? 1U : 0U;
    USART1_DebugWrite("COLLECT: mpu init end\r\n");

    if (mpu6050_init_ok != 0U) {
        debug_printfln("MPU6050 init success (PB6=SCL, PB7=SDA)");
    } else {
        debug_printfln("MPU6050 init failed! Check PB6/PB7 wiring");
    }
}

void app_collect_vibration()
{
    static TickType_t last_log_tick;
    uint32_t adc_raw = 0U;

    if (HAL_ADC_Start(&hadc1) == HAL_OK) {
        if (HAL_ADC_PollForConversion(&hadc1, 20U) == HAL_OK) {
            adc_raw = HAL_ADC_GetValue(&hadc1);
        }
        HAL_ADC_Stop(&hadc1);
    }

    value.smoke = (int)adc_raw;
    value.smoke_voltage = ((float)adc_raw * 3.3f) / 4095.0f;
    value.red = (HAL_GPIO_ReadPin(RED_DO_GPIO_Port, RED_DO_Pin) == GPIO_PIN_SET) ? 1U : 0U;
    value.flame = (HAL_GPIO_ReadPin(FLAME_DO_GPIO_Port, FLAME_DO_Pin) == GPIO_PIN_SET) ? 1U : 0U;

    app_collect_mpu6050();

    if ((xTaskGetTickCount() - last_log_tick) >= pdMS_TO_TICKS(1000U)) {
        debug_printfln("mq=%d(%.2fV), red=%d, flame=%d, pitch=%.1f, roll=%.1f, yaw=%.1f",
                       value.smoke,
                       value.smoke_voltage,
                       value.red,
                       value.flame,
                       value.pitch,
                       value.roll,
                       value.yaw);
        last_log_tick = xTaskGetTickCount();
    }
}

void app_collect_vibration_jump()
{
}

void app_collect_dht11()
{
    static TickType_t last_read_tick;
    uint8_t read_result;

    if ((last_read_tick != 0U) && ((xTaskGetTickCount() - last_read_tick) < pdMS_TO_TICKS(2000U))) {
        return;
    }

    if (dht11_init_ok == 0U) {
        read_result = DHT11_Init();
        if (read_result == 0U) {
            debug_printfln("DHT11 init success (PA0 + TIM3)");
            dht11_init_ok = 1U;
        } else {
            debug_printfln("DHT11 init failed! Check PA0");
            value.status = 0;
            return;
        }
    }

    read_result = DHT11_Read_Data(&value.temperature, &value.humidity);
    if (read_result == 0U) {
        debug_printfln("DHT11: Temp=%dC, Humi=%d%%RH", value.temperature, value.humidity);
        if (mpu6050_init_ok != 0U) {
            value.status = 1;
        }
    } else {
        debug_printfln("DHT11 read failed! Retry next time");
        value.status = 0;
    }

    last_read_tick = xTaskGetTickCount();
}

void app_collect_get_snapshot(cgq_data *out)
{
    if (out == NULL) {
        return;
    }

    *out = value;
}
