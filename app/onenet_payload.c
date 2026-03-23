#include "onenet_payload.h"

#include <stdio.h>

static const char *onenet_bool_text(int value) {
    return (value != 0) ? "true" : "false";
}

int onenet_build_property_payload(char *buf,
                                  size_t buf_len,
                                  const cgq_data *sensor,
                                  const onenet_report_meta_t *meta) {
    int len;

    if ((buf == NULL) || (sensor == NULL) || (meta == NULL) || (buf_len == 0U)) {
        return -1;
    }

    len = snprintf(buf,
                   buf_len,
                   "{\"id\":\"%lu\",\"version\":\"1.0\",\"params\":{"
                   "\"posture\":{\"value\":{\"pitch\":%.2f,\"roll\":%.2f,\"yaw\":%.2f}},"
                   "\"CollectionEquipmentStatus\":{\"value\":%d},"
                   "\"flame\":{\"value\":%s},"
                   "\"humidity\":{\"value\":%u},"
                   "\"red\":{\"value\":%s},"
                   "\"smoke\":{\"value\":%s},"
                   "\"temperature\":{\"value\":%u}"
                   "}}",
                   (unsigned long)meta->msg_id,
                   meta->posture.pitch,
                   meta->posture.roll,
                   meta->posture.yaw,
                   meta->collection_status,
                   onenet_bool_text(meta->flame),
                   sensor->humidity,
                   onenet_bool_text(meta->red),
                   onenet_bool_text(meta->smoke),
                   sensor->temperature);

    if ((len < 0) || ((size_t)len >= buf_len)) {
        return -2;
    }

    return len;
}

int onenet_build_demo_payload(char *buf, size_t buf_len, uint32_t msg_id, uint8_t demo_index) {
    cgq_data sensor = {0};
    onenet_report_meta_t meta = {0};

    if (demo_index == 0U) {
        sensor.temperature = 52;
        sensor.humidity = 46;
        sensor.smoke = 1;
        meta.collection_status = 0;
        meta.flame = 0;
        meta.red = 0;
        meta.smoke = 1;
        meta.posture.pitch = 12.3f;
        meta.posture.roll = 1.1f;
        meta.posture.yaw = 32.0f;
    } else {
        sensor.temperature = 52;
        sensor.humidity = 61;
        sensor.smoke = 0;
        meta.collection_status = 1;
        meta.flame = 1;
        meta.red = 1;
        meta.smoke = 0;
        meta.posture.pitch = 88.8f;
        meta.posture.roll = 6.6f;
        meta.posture.yaw = 123.0f;
    }

    meta.msg_id = msg_id;
    return onenet_build_property_payload(buf, buf_len, &sensor, &meta);
}
