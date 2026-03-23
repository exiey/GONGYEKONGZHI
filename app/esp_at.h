#ifndef ESP_AT_H
#define ESP_AT_H

#include <stdint.h>

void esp_at_init(void);
void esp_at_clear_rx_buffer(void);
const char *esp_at_get_rx_buffer(void);

int esp_at_send_raw(const char *data);
int esp_at_send_cmd_wait(const char *cmd, const char *expect, uint32_t timeout_ms);
int esp_at_wait_response(const char *expect, uint32_t timeout_ms);
int esp_at_wait_prompt(uint32_t timeout_ms);

void esp_at_rx_byte(uint8_t byte);
void esp_at_rx_cplt_isr(void);

#endif
