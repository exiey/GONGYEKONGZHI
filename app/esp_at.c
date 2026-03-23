#include "esp_at.h"

#include <string.h>

#include "Common_Debug.h"
#include "FreeRTOS.h"
#include "task.h"
#include "usart.h"

#define ESP_AT_RX_BUF_LEN 2048U

static uint8_t esp_at_rx_byte_buf;
static char esp_at_rx_buf[ESP_AT_RX_BUF_LEN];
static volatile uint16_t esp_at_rx_len;

static void esp_at_log_line(const char *prefix, const char *text) {
    char log_buf[220];
    size_t text_len;

    if ((prefix == NULL) || (text == NULL)) {
        return;
    }

    text_len = strlen(text);
    if (text_len > 120U) {
        text_len = 120U;
    }

    snprintf(log_buf, sizeof(log_buf), "%s%.*s\r\n", prefix, (int)text_len, text);
    USART1_DebugWrite(log_buf);
}

static int esp_at_response_contains(const char *text) {
    if (text == NULL) {
        return 0;
    }

    return (strstr(esp_at_rx_buf, text) != NULL) ? 1 : 0;
}

void esp_at_init(void) {
    esp_at_clear_rx_buffer();
    HAL_UART_Receive_IT(&huart2, &esp_at_rx_byte_buf, 1);
}

void esp_at_clear_rx_buffer(void) {
    __disable_irq();
    memset(esp_at_rx_buf, 0, sizeof(esp_at_rx_buf));
    esp_at_rx_len = 0;
    __enable_irq();
}

const char *esp_at_get_rx_buffer(void) {
    return esp_at_rx_buf;
}

int esp_at_send_raw(const char *data) {
    uint16_t len;

    if (data == NULL) {
        return -1;
    }

    esp_at_log_line("ESP_TX: ", data);
    len = (uint16_t)strlen(data);
    return (HAL_UART_Transmit(&huart2, (uint8_t *)data, len, 3000) == HAL_OK) ? 0 : -1;
}

int esp_at_wait_response(const char *expect, uint32_t timeout_ms) {
    uint32_t start = HAL_GetTick();

    while ((HAL_GetTick() - start) < timeout_ms) {
        if (esp_at_response_contains(expect)) {
            esp_at_log_line("ESP_RX_OK: ", esp_at_rx_buf);
            return 0;
        }

        if (esp_at_response_contains("\r\nERROR\r\n") ||
            esp_at_response_contains("\r\nFAIL\r\n") ||
            esp_at_response_contains("+MQTTDISCONNECTED")) {
            esp_at_log_line("ESP_RX_ERR: ", esp_at_rx_buf);
            debug_printfln("ESP-AT error: %s", esp_at_rx_buf);
            return -1;
        }

        vTaskDelay(pdMS_TO_TICKS(20));
    }

    esp_at_log_line("ESP_RX_TO: ", esp_at_rx_buf);
    debug_printfln("ESP-AT timeout expect=%s, rx=%s", expect, esp_at_rx_buf);
    return -2;
}

int esp_at_wait_prompt(uint32_t timeout_ms) {
    return esp_at_wait_response(">", timeout_ms);
}

int esp_at_send_cmd_wait(const char *cmd, const char *expect, uint32_t timeout_ms) {
    esp_at_clear_rx_buffer();
    if (esp_at_send_raw(cmd) != 0) {
        return -1;
    }
    return esp_at_wait_response(expect, timeout_ms);
}

void esp_at_rx_byte(uint8_t byte) {
    uint16_t next_len = esp_at_rx_len;

    if (next_len >= (ESP_AT_RX_BUF_LEN - 1U)) {
        esp_at_rx_len = 0;
        next_len = 0;
        memset(esp_at_rx_buf, 0, sizeof(esp_at_rx_buf));
    }

    esp_at_rx_buf[next_len++] = (char)byte;
    esp_at_rx_buf[next_len] = '\0';
    esp_at_rx_len = next_len;

    HAL_UART_Receive_IT(&huart2, &esp_at_rx_byte_buf, 1);
}

void esp_at_rx_cplt_isr(void) {
    esp_at_rx_byte(esp_at_rx_byte_buf);
}
