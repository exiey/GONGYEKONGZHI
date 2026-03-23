#include "onenet_at.h"

#include <stdio.h>
#include <string.h>

#include "Common_Debug.h"
#include "FreeRTOS.h"
#include "app_datacollect.h"
#include "esp_at.h"
#include "onenet_at_config.h"
#include "onenet_payload.h"
#include "task.h"

#define ONENET_AT_STACK_BUF_LEN 512
#define ONENET_REPORT_PERIOD_MS 3000U

static int esp_at_send_long_text_command(const char *cmd_prefix,
                                         const char *data,
                                         const char *ok_expect) {
    char cmd[64];
    size_t data_len;

    if ((cmd_prefix == NULL) || (data == NULL) || (ok_expect == NULL)) {
        return -1;
    }

    data_len = strlen(data);
    snprintf(cmd, sizeof(cmd), "%s0,%u\r\n", cmd_prefix, (unsigned int)data_len);

    esp_at_clear_rx_buffer();
    if (esp_at_send_raw(cmd) != 0) {
        return -1;
    }

    if (esp_at_wait_prompt(3000) != 0) {
        return -1;
    }

    if (esp_at_send_raw(data) != 0) {
        return -1;
    }

    return esp_at_wait_response(ok_expect, 5000);
}

static int onenet_esp_at_basic_init(void) {
    char cmd[256];
    size_t username_len = strlen(ONENET_MQTT_USERNAME);
    size_t password_len = strlen(ONENET_MQTT_PASSWORD);
    size_t client_id_len = strlen(ONENET_DEVICE_NAME);

    if (strlen(ESP_AT_WIFI_SSID) == 0U) {
        debug_printfln("Set ESP_AT_WIFI_SSID and ESP_AT_WIFI_PASSWORD first");
        return -1;
    }

    if (client_id_len > 256U) {
        debug_printfln("ESP-AT MQTT client id too long");
        return -1;
    }

    if (username_len > 64U) {
        debug_printfln("ESP-AT MQTT username too long");
        return -1;
    }

    if (esp_at_send_cmd_wait("AT\r\n", "OK", 2000) != 0) {
        return -1;
    }

    esp_at_send_cmd_wait("ATE0\r\n", "OK", 2000);
    esp_at_send_cmd_wait("AT+CWMODE=1\r\n", "OK", 3000);
    esp_at_send_cmd_wait("AT+MQTTCLEAN=0\r\n", "OK", 5000);

    snprintf(cmd, sizeof(cmd), "AT+CWJAP=\"%s\",\"%s\"\r\n", ESP_AT_WIFI_SSID, ESP_AT_WIFI_PASSWORD);
    if (esp_at_send_cmd_wait(cmd, "OK", 20000) != 0) {
        return -1;
    }

    snprintf(cmd, sizeof(cmd), "AT+MQTTUSERCFG=0,2,\"\",\"\",\"\",0,0,\"\"\r\n");
    if (esp_at_send_cmd_wait(cmd, "OK", 5000) != 0) {
        return -1;
    }

    snprintf(cmd, sizeof(cmd), "AT+MQTTCLIENTID=0,\"%s\"\r\n", ONENET_DEVICE_NAME);
    if (esp_at_send_cmd_wait(cmd, "OK", 5000) != 0) {
        return -1;
    }

    snprintf(cmd, sizeof(cmd), "AT+MQTTUSERNAME=0,\"%s\"\r\n", ONENET_MQTT_USERNAME);
    if (esp_at_send_cmd_wait(cmd, "OK", 5000) != 0) {
        return -1;
    }

    if (password_len > 64U) {
        if (esp_at_send_long_text_command("AT+MQTTLONGPASSWORD=", ONENET_MQTT_PASSWORD, "OK") != 0) {
            snprintf(cmd, sizeof(cmd), "AT+MQTTPASSWORD=0,\"%s\"\r\n", ONENET_MQTT_PASSWORD);
            if (esp_at_send_cmd_wait(cmd, "OK", 5000) != 0) {
                return -1;
            }
        }
    } else {
        snprintf(cmd, sizeof(cmd), "AT+MQTTPASSWORD=0,\"%s\"\r\n", ONENET_MQTT_PASSWORD);
        if (esp_at_send_cmd_wait(cmd, "OK", 5000) != 0) {
            return -1;
        }
    }

    snprintf(cmd,
             sizeof(cmd),
             "AT+MQTTCONN=0,\"%s\",%d,0\r\n",
             ONENET_MQTT_HOST,
             ONENET_MQTT_PORT);
    if (esp_at_send_cmd_wait(cmd, "OK", 15000) != 0) {
        return -1;
    }

    return 0;
}

static int onenet_esp_at_publish(const char *payload) {
    char cmd[160];
    size_t payload_len;

    if (payload == NULL) {
        return -1;
    }

    payload_len = strlen(payload);
    snprintf(cmd,
             sizeof(cmd),
             "AT+MQTTPUBRAW=0,\"%s\",%u,0,0\r\n",
             ONENET_MQTT_TOPIC,
             (unsigned int)payload_len);

    esp_at_clear_rx_buffer();
    if (esp_at_send_raw(cmd) != 0) {
        return -1;
    }

    if (esp_at_wait_prompt(5000) != 0) {
        return -1;
    }

    if (esp_at_send_raw(payload) != 0) {
        return -1;
    }

    if (esp_at_wait_response("+MQTTPUB:OK", 10000) != 0) {
        if (esp_at_wait_response("OK", 2000) != 0) {
            return -1;
        }
    }

    debug_printfln("MQTT publish ok: %s", payload);
    return 0;
}

static void onenet_publish_sensor_snapshot(uint32_t msg_id) {
    char payload[ONENET_AT_STACK_BUF_LEN];
    cgq_data sensor = {0};
    onenet_report_meta_t meta = {0};
    int payload_len;

    app_collect_get_snapshot(&sensor);

    meta.msg_id = msg_id;
    meta.collection_status = sensor.status;
    meta.flame = sensor.flame ? 1 : 0;
    meta.red = sensor.red ? 1 : 0;
    meta.smoke = (sensor.smoke > 2000) ? 1 : 0;
    meta.posture.pitch = sensor.pitch;
    meta.posture.roll = sensor.roll;
    meta.posture.yaw = sensor.yaw;

    debug_printfln("OneNET snapshot: id=%lu temp=%u humi=%u smoke=%d red=%u flame=%u pitch=%.1f roll=%.1f yaw=%.1f",
                   (unsigned long)msg_id,
                   sensor.temperature,
                   sensor.humidity,
                   sensor.smoke,
                   sensor.red,
                   sensor.flame,
                   sensor.pitch,
                   sensor.roll,
                   sensor.yaw);

    payload_len = onenet_build_property_payload(payload, sizeof(payload), &sensor, &meta);
    if (payload_len <= 0) {
        debug_printfln("OneNET payload build failed: %d", payload_len);
        return;
    }

    debug_printfln("OneNET payload len=%d", payload_len);
    if (onenet_esp_at_publish(payload) != 0) {
        debug_printfln("OneNET publish failed");
    } else {
        debug_printfln("OneNET publish task success");
    }
}

void onenet_at_task(void *pvParameters) {
    uint32_t msg_id = 2000U;

    (void)pvParameters;

    vTaskDelay(pdMS_TO_TICKS(2000));
    esp_at_init();

    while (1) {
        if (onenet_esp_at_basic_init() == 0) {
            debug_printfln("ESP-AT OneNET login ok");

            while (1) {
                onenet_publish_sensor_snapshot(msg_id++);
                vTaskDelay(pdMS_TO_TICKS(ONENET_REPORT_PERIOD_MS));
            }
        }

        debug_printfln("ESP-AT init/login failed, retry after 5s");
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}
