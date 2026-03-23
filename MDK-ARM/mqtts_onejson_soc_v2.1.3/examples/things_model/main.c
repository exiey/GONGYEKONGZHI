/**
 * Copyright (c), 2012~2024 iot.10086.cn All Rights Reserved
 *
 * @file main.c
 * @brief Thing model example
 */

/*****************************************************************************/
/* Includes                                                                  */
/*****************************************************************************/
#include "common.h"
#include "dev_cardmgr.h"
#include "err_def.h"
#include "log.h"
#include "aiot_tm_api.h"
#include "plat_time.h"
#include "tm_data.h"
#include "tm_user.h"

#ifndef PRODUCT_ID
#define PRODUCT_ID ""
#endif

#ifndef DEVICE_NAME
#define DEVICE_NAME ""
#endif

#ifndef ACCESS_KEY
#define ACCESS_KEY ""
#endif

/** token Effective time，The default is 2030.12*/
#define TM_EXPIRE_TIME 1924833600

#include <signal.h> // 添加信号处理头文件
// 定义退出标志（volatile确保可见性，sig_atomic_t确保原子性）
static volatile sig_atomic_t exit_flag = 0;

static int32_t post_fake_onejson_data(uint32_t seq) {
  int32_t ret = 0;
  uint64_t ts = time_count_ms();
  void *data = tm_data_create();
  struct prop_posture_t posture = {0};

  if (NULL == data) {
    return ERR_IO;
  }

  posture.pitch = (float32_t)(5.0f + (seq % 10) * 1.1f);
  posture.roll = (float32_t)(-3.0f + (seq % 8) * 0.8f);
  posture.yaw = (float32_t)(30.0f + (seq % 12) * 2.5f);

  tm_prop_CollectionEquipmentStatus_notify(data, 0, ts, 0);
  tm_prop_flame_notify(data, (seq % 5 == 0) ? 1 : 0, ts, 0);
  tm_prop_humidity_notify(data, (float32_t)(50.0f + (seq % 10) * 1.3f), ts, 0);
  tm_prop_posture_notify(data, posture, ts, 0);
  tm_prop_red_notify(data, (seq % 2), ts, 0);
  tm_prop_smoke_notify(data, (seq % 7 == 0) ? 1 : 0, ts, 0);
  tm_prop_temperature_notify(data, (float32_t)(24.5f + (seq % 6) * 0.7f), ts,
                             0);

  ret = tm_post_property(data, 5000);
  tm_data_delete(data);
  return ret;
}

int main(int argc, char *argv[]) {
  AIOT_ASSERT(!IS_EMPTY(PRODUCT_ID));
  AIOT_ASSERT(!IS_EMPTY(DEVICE_NAME));
  AIOT_ASSERT(!IS_EMPTY(ACCESS_KEY));

  int ret = 0;
  int timeout_ms = 60 * 1000;

  /** Device Login*/
  ret =
      tm_login(PRODUCT_ID, DEVICE_NAME, ACCESS_KEY, TM_EXPIRE_TIME, timeout_ms);
  CHECK_EXPR_GOTO(ERR_OK != ret, _END, "ThingModel login failed!");
  logi("ThingModel login ok");

  uint32_t report_seq = 0;
  uint64_t next_report_ms = time_count_ms() + 3000;

  while (!exit_flag) {
    if (0 != (ret = tm_step(200))) {
      loge("ThingModel tm_step failed,ret is %d", ret);
      break;
    }

    if (time_count_ms() >= next_report_ms) {
      ret = post_fake_onejson_data(report_seq++);
      if (ret != ERR_OK) {
        loge("ThingModel fake property post failed, ret = %d", ret);
      } else {
        logi("ThingModel fake property post ok, seq = %u", report_seq - 1);
      }
      next_report_ms = time_count_ms() + 5000;
    }
  }

_END:
  /** device deregistration*/
  tm_logout(3000);
  return 0;
}
