#ifndef __SPI_OLED_HAL_H
#define __SPI_OLED_HAL_H			   
#include "stm32f1xx_hal.h"  // 间接包含stm32f1xx_hal_cortex.h
#include "stdlib.h"	 
#include "spi.h"

//-----------------OLED端口定义----------------  					   

#define SPI_OLED_SCLK_Clr() HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET)//CLK
#define SPI_OLED_SCLK_Set() HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET)

#define SPI_OLED_SDIN_Clr() HAL_GPIO_WritePin(GPIOA, GPIO_PIN_7, GPIO_PIN_RESET)//DIN
#define SPI_OLED_SDIN_Set() HAL_GPIO_WritePin(GPIOA, GPIO_PIN_7, GPIO_PIN_SET)

#define SPI_OLED_RST_Clr() HAL_GPIO_WritePin(GPIOB, GPIO_PIN_2, GPIO_PIN_RESET)//RES
#define SPI_OLED_RST_Set() HAL_GPIO_WritePin(GPIOB, GPIO_PIN_2, GPIO_PIN_SET)

#define SPI_OLED_DC_Clr() HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_RESET)//DC
#define SPI_OLED_DC_Set() HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_SET)

#define SPI_OLED_CS_Clr()  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_RESET)//CS
#define SPI_OLED_CS_Set()  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_SET)

#define OLED_CMD  0	//写命令
#define OLED_DATA 1	//写数据

//OLED控制用函数
void SPI_OLED_Init(void);
void SPI1_SetSpeed(uint8_t SPI_BaudRatePrescaler);
uint8_t SPI1_WriteByte(uint8_t TxData);
void SPI_OLED_WR_Byte(uint8_t dat,uint8_t cmd);
void SPI_OLED_Set_Pos(unsigned char x, unsigned char y);
void SPI_OLED_Display_On(void);
void SPI_OLED_Display_Off(void);
void SPI_OLED_Clear(void);

void SPI_OLED_ShowCHinese(uint8_t x,uint8_t y,uint8_t no);
void SPI_OLED_DrawBMP(unsigned char x0, unsigned char y0,unsigned char x1, unsigned char y1,unsigned char BMP[]);
void SPI_OLED_ShowChar(uint16_t x,uint16_t y, uint8_t num);
void SPI_OLED_ShowString(uint16_t x,uint16_t y,char *p);
void SPI_OLED_ShowInt32Num(uint16_t x,uint16_t y, int32_t num, uint8_t len);
void SPI_OLED_DrawFont16(uint16_t x, uint16_t y, char *s);
void SPI_OLED_DrawFont32(uint16_t x, uint16_t y, char *s);
void SPI_OLED_Show_Str(uint16_t x, uint16_t y, char *str,uint8_t size);

#endif  