#include "MQ_Sensor.h"


static unsigned int adc_value = 0; //保存ADC数值

//MQ8数据获取
float GetMQ8Out(void)
{
    double volt = 0;
    double ppm = 0;
    
    delay_ms(20);
    
    //adc数值
    adc_value = Get_Adc(1);
    printf("adcvalue = %d.\n",adc_value);

    
    //adc输出电压
    volt=(double)adc_value*3.3/4095;
    printf("volt = %f.\n",volt);
    
    //根据电压值换算成被检测气体的污染指数

    // MQ135 MQ8 H2 空气质量 通用 
    // volt = ((3.65*pow(ppm,0.3203*2))/(34.88+pow(ppm,0.3203*2))+0.6);
    ppm = pow(10, (log10(34.88*(volt-0.6)/(3.65-volt+0.6)))/(0.3203*2));

    printf("ppm = %f.\n\n",ppm);
    return volt;
}

//MQ135数据获取
float GetMQ135Out(void)
{
    double volt = 0;
    double ppm = 0;
    
    delay_ms(20);
    
    //adc数值
    adc_value = Get_Adc(1);
    printf("adcvalue = %d.\n",adc_value);

    
    //adc输出电压
    volt=(double)adc_value*3.3/4095;
    printf("volt = %f.\n",volt);
    
    //根据电压值换算成被检测气体的污染指数

    // MQ135 MQ8 H2 空气质量 通用 
    // volt = ((3.65*pow(ppm,0.3203*2))/(34.88+pow(ppm,0.3203*2))+0.6);
    ppm = pow(10, (log10(34.88*(volt-0.6)/(3.65-volt+0.6)))/(0.3203*2));

    printf("ppm = %f.\n\n",ppm);
    return volt;
}

//MQ136数据获取
float GetMQ136Out(void)
{
    double volt = 0;
    double ppm = 0;
    
    delay_ms(20);
    
    //adc数值
    adc_value = Get_Adc(1);
    printf("adcvalue = %d.\n",adc_value);

    
    //adc输出电压
    volt=(double)adc_value*3.3/4095;
    printf("volt = %f.\n",volt);
    
    //根据电压值换算成被检测气体的污染指数
    //MQ136~138 H2S NH3 PA 通用
    // volt = ((2.3*pow(4*ppm,0.3203*2))/(34.88+pow(4*ppm,0.3203*2))+0.6); 
    ppm = (pow(10, (log10(34.88*(volt-0.6)/(2.3-volt+0.6)))/(0.3203*2)))/4;


    printf("ppm = %f.\n\n",ppm);
    return volt;
}

//MQ137数据获取
float GetMQ137Out(void)
{
    double volt = 0;
    double ppm = 0;
    
    delay_ms(20);
    
    //adc数值
    adc_value = Get_Adc(1);
    printf("adcvalue = %d.\n",adc_value);

    
    //adc输出电压
    volt=(double)adc_value*3.3/4095;
    printf("volt = %f.\n",volt);
    
    //根据电压值换算成被检测气体的污染指数
    //MQ136~138 H2S NH3 PA 通用
    // volt = ((2.3*pow(4*ppm,0.3203*2))/(34.88+pow(4*ppm,0.3203*2))+0.6); 
    ppm = (pow(10, (log10(34.88*(volt-0.6)/(2.3-volt+0.6)))/(0.3203*2)))/4;


    printf("ppm = %f.\n\n",ppm);
    return volt;
}

//MQ138数据获取
float GetMQ138Out(void)
{
    double volt = 0;
    double ppm = 0;
    
    delay_ms(20);
    
    //adc数值
    adc_value = Get_Adc(1);
    printf("adcvalue = %d.\n",adc_value);

    
    //adc输出电压
    volt=(double)adc_value*3.3/4095;
    printf("volt = %f.\n",volt);
    
    //根据电压值换算成被检测气体的污染指数
    //MQ136~138 H2S NH3 PA 通用
    // volt = ((2.3*pow(4*ppm,0.3203*2))/(34.88+pow(4*ppm,0.3203*2))+0.6); 
    ppm = (pow(10, (log10(34.88*(volt-0.6)/(2.3-volt+0.6)))/(0.3203*2)))/4;


    printf("ppm = %f.\n\n",ppm);
    return volt;
}