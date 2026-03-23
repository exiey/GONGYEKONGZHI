#ifndef __OLEDFONT_HAL_H
#define __OLEDFONT_HAL_H

#include "stdint.h"

#define GB16_NUM 8
#define GB32_NUM 8

extern const uint8_t ASCII_1608[95][16];

typedef struct 
{
    uint8_t Index[3];    
    uint8_t Msk[32];
}typFNT_GB16; 

typedef struct 
{
    uint8_t Index[3];    
    uint8_t Msk[128];
}typFNT_GB32; 

extern char Hzk[][32];
extern const typFNT_GB16 Tfont16[GB16_NUM];
extern const typFNT_GB32 Tfont32[GB32_NUM];

#endif