#include "App_Task.h"
#include "FreeRTOS.h"
#include "task.h"
#include "Common_Debug.h"
#include "app_datacollect.h"
#include "onenet_at.h"

#define START_STACK_DEPTH 256
#define START_TASK_PRIORITY 1
TaskHandle_t start_task_handle;

static void Start_Task(void *pvParameters);

#define TASK_2MS_STACK_DEPTH 256
#define TASK_2MS_PRIORITY 4
TaskHandle_t task_2ms_handle;
static void App_Task_2MS(void *pvParameters);

#define TASK_4MS_STACK_DEPTH 256
#define TASK_4MS_PRIORITY 3
TaskHandle_t task_4ms_handle;
static void App_Task_4MS(void *pvParameters);

#define TASK_50MS_STACK_DEPTH 256
#define TASK_50MS_PRIORITY 2
TaskHandle_t task_50ms_handle;
static void App_Task_50MS(void *pvParameters);

#define TASK_ONENET_STACK_DEPTH 768
#define TASK_ONENET_PRIORITY 2
TaskHandle_t task_onenet_handle;

void FreeRTOS_Start(void) {
    xTaskCreate((TaskFunction_t)Start_Task,
                (char *)"Start_Task",
                (configSTACK_DEPTH_TYPE)START_STACK_DEPTH,
                (void *)NULL,
                (UBaseType_t)START_TASK_PRIORITY,
                (TaskHandle_t *)&start_task_handle);

    vTaskStartScheduler();
}

static void Start_Task(void *pvParameters) {
    (void)pvParameters;

    debug_printfln("RTOS: Start_Task enter");
    taskENTER_CRITICAL();

    xTaskCreate((TaskFunction_t)App_Task_2MS,
                (char *)"App_Task_2MS",
                (configSTACK_DEPTH_TYPE)TASK_2MS_STACK_DEPTH,
                (void *)NULL,
                (UBaseType_t)TASK_2MS_PRIORITY,
                (TaskHandle_t *)&task_2ms_handle);

    xTaskCreate((TaskFunction_t)App_Task_4MS,
                (char *)"App_Task_4MS",
                (configSTACK_DEPTH_TYPE)TASK_4MS_STACK_DEPTH,
                (void *)NULL,
                (UBaseType_t)TASK_4MS_PRIORITY,
                (TaskHandle_t *)&task_4ms_handle);

    xTaskCreate((TaskFunction_t)App_Task_50MS,
                (char *)"App_Task_50MS",
                (configSTACK_DEPTH_TYPE)TASK_50MS_STACK_DEPTH,
                (void *)NULL,
                (UBaseType_t)TASK_50MS_PRIORITY,
                (TaskHandle_t *)&task_50ms_handle);

    xTaskCreate((TaskFunction_t)onenet_at_task,
                (char *)"OneNET_AT",
                (configSTACK_DEPTH_TYPE)TASK_ONENET_STACK_DEPTH,
                (void *)NULL,
                (UBaseType_t)TASK_ONENET_PRIORITY,
                (TaskHandle_t *)&task_onenet_handle);

    taskEXIT_CRITICAL();
    debug_printfln("RTOS: tasks created");
    vTaskDelete(NULL);
}

static void App_Task_2MS(void *pvParameters) {
    TickType_t pxPreviousWakeTime;
    (void)pvParameters;

    pxPreviousWakeTime = xTaskGetTickCount();
    while (1) {
        vTaskDelayUntil(&pxPreviousWakeTime, 2);
    }
}

static void App_Task_4MS(void *pvParameters) {
    TickType_t pxPreviousWakeTime;
    (void)pvParameters;

    pxPreviousWakeTime = xTaskGetTickCount();
    while (1) {
        vTaskDelayUntil(&pxPreviousWakeTime, 4);
    }
}

static void App_Task_50MS(void *pvParameters) {
    TickType_t pxPreviousWakeTime;
    TickType_t heartbeat_tick;
    (void)pvParameters;

    pxPreviousWakeTime = xTaskGetTickCount();
    heartbeat_tick = pxPreviousWakeTime;
    while (1) {
        app_collect_vibration();
        app_collect_dht11();
        if ((xTaskGetTickCount() - heartbeat_tick) >= pdMS_TO_TICKS(2000U)) {
            debug_printfln("RTOS: 50ms task alive");
            heartbeat_tick = xTaskGetTickCount();
        }
        vTaskDelayUntil(&pxPreviousWakeTime, 50);
    }
}
