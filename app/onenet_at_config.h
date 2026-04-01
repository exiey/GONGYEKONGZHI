#ifndef ONENET_AT_CONFIG_H
#define ONENET_AT_CONFIG_H

#define ESP_AT_WIFI_SSID "这里填写你的WiFi名称"
#define ESP_AT_WIFI_PASSWORD "这里填写你的WiFi密码"

#define ONENET_PRODUCT_ID "这里填写你的OneNET产品ID"
#define ONENET_DEVICE_NAME "这里填写你的OneNET设备名称"
#define ONENET_MQTT_USERNAME ONENET_PRODUCT_ID

/*
 * Fill in the verified OneNET token generated for your device.
 */
#define ONENET_MQTT_PASSWORD "这里填写你的OneNET MQTT Token"

#define ONENET_MQTT_HOST "这里填写你的OneNET MQTT地址"
#define ONENET_MQTT_PORT 8883
#define ONENET_MQTT_TOPIC "这里填写你的OneNET MQTT主题"

#endif
