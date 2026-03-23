#ifndef ONENET_AT_CONFIG_H
#define ONENET_AT_CONFIG_H

#define ESP_AT_WIFI_SSID "TP-LINK_B6C2"
#define ESP_AT_WIFI_PASSWORD "xf683270//#"

#define ONENET_PRODUCT_ID "fjIr89gNlc"
#define ONENET_DEVICE_NAME "esp32c3-001"
#define ONENET_MQTT_USERNAME ONENET_PRODUCT_ID

/*
 * This password is the verified OneNET token from the user's platform log.
 * Expire time(et): 1805687953, which is 2027-03-22 03:59:13 UTC.
 */
#define ONENET_MQTT_PASSWORD "version=2018-10-31&res=products%2FfjIr89gNlc%2Fdevices%2Fesp32c3-001&et=1805687953&method=md5&sign=wcD0ELIFVqjyBbcdjs2S3A%3D%3D"

#define ONENET_MQTT_HOST "fjIr89gNlc.mqttstls.acc.cmcconenet.cn"
#define ONENET_MQTT_PORT 8883
#define ONENET_MQTT_TOPIC "$sys/fjIr89gNlc/esp32c3-001/thing/property/post"

#endif
