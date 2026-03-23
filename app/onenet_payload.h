#ifndef ONENET_PAYLOAD_H
#define ONENET_PAYLOAD_H

#include <stddef.h>
#include <stdint.h>

#include "app_datacollect.h"

typedef struct {
    float pitch;
    float roll;
    float yaw;
} onenet_posture_t;

typedef struct {
    uint32_t msg_id;
    int collection_status;
    int flame;
    int red;
    int smoke;
    onenet_posture_t posture;
} onenet_report_meta_t;

int onenet_build_property_payload(char *buf,
                                  size_t buf_len,
                                  const cgq_data *sensor,
                                  const onenet_report_meta_t *meta);

int onenet_build_demo_payload(char *buf, size_t buf_len, uint32_t msg_id, uint8_t demo_index);

#endif
