#ifndef __COMMON_DEBUG__
#define __COMMON_DEBUG__

#include "usart.h"
#include <stdio.h>
    #define DEBUG
    #ifdef DEBUG
    // 定义可变参数版本的 debug_printf
    #define FILENAME (strrchr(__FILE__, '\\') ? strrchr(__FILE__, '\\') + 1 : __FILE__)
    // 在前面添加文件名和行号。
    #define debug_printf(format, ...) printf("[%s:%d]--" format, FILENAME, __LINE__, ##__VA_ARGS__)
    // 在字符串末尾添加\r\n之后再输出
    #define debug_printfln(format, ...) printf("[%s:%d]--" format "\r\n", __FILE__, __LINE__, ##__VA_ARGS__)
    #else
    #define debug_printf(format,...)
    #endif

void Common_Debug_Init();

#endif

