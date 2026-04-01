/**
 * ESP32-C3 IoT 监测设备代码
 * 功能：作为 WiFi AP，提供 HTTP Server 接收指令和返回传感器数据
 * 
 * 使用方法：
 * 1. 手机连接 ESP32 WiFi（SSID: ESP32-IoT-001，密码：12345678）
 * 2. 访问 http://192.168.4.1/data 获取传感器数据
 * 3. POST http://192.168.4.1/command 发送控制指令
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <MPU6050.h>

// ==================== 配置参数 ====================
const char* ssid = "ESP32-IoT-001";
const char* password = "12345678";

// 引脚定义（根据实际连接修改）
#define DHT_PIN 4           // DHT11/DHT22 数据引脚
#define DHT_TYPE DHT22      // DHT22 (AM2302)
#define SMOKE_PIN 34        // 烟雾传感器模拟引脚
#define FLAME_PIN 35        // 火焰传感器模拟引脚
#define PIR_PIN 5           // 人体红外传感器数字引脚

// ==================== 全局对象 ====================
WebServer server(80);
DHT dht(DHT_PIN, DHT_TYPE);
MPU6050 mpu;

// 设备信息
String deviceId = "factory_monitor_001";
String factoryArea = "高危化工区A栋2层";
String firmwareVersion = "V1.2.3";

// 阈值配置
struct ThresholdConfig {
  float tempMin = -10.0;
  float tempMax = 60.0;
  float humidityMin = 10.0;
  float humidityMax = 95.0;
  float smokeMax = 0.1;
  float flameMin = 1.0;
} thresholds;

// 校准状态
bool mpuCalibrated = false;

// ==================== 初始化 ====================
void setup() {
  Serial.begin(115200);
  
  // 初始化传感器
  dht.begin();
  
  Wire.begin();
  mpu.initialize();
  if (mpu.testConnection()) {
    Serial.println("MPU6050 连接成功");
  } else {
    Serial.println("MPU6050 连接失败");
  }
  
  // 设置引脚模式
  pinMode(PIR_PIN, INPUT);
  pinMode(SMOKE_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);
  
  // 创建 WiFi AP
  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP 地址: ");
  Serial.println(IP);
  
  // 设置 HTTP 路由
  server.on("/data", HTTP_GET, handleGetData);
  server.on("/command", HTTP_POST, handleCommand);
  server.on("/health", HTTP_GET, handleHealth);
  
  // 启动服务器
  server.begin();
  Serial.println("HTTP 服务器已启动");
}

// ==================== 主循环 ====================
void loop() {
  server.handleClient();
  delay(10);
}

// ==================== 读取传感器数据 ====================
JsonObject readSensors(JsonDocument& doc) {
  JsonObject sensorData = doc["sensor_data"].to<JsonObject>();
  
  // 温湿度
  float temp = dht.readTemperature();
  float humi = dht.readHumidity();
  JsonObject tempHumidity = sensorData["temperature_humidity"].to<JsonObject>();
  tempHumidity["temperature"] = isnan(temp) ? 0.0 : temp;
  tempHumidity["humidity"] = isnan(humi) ? 0.0 : humi;
  tempHumidity["status"] = (temp >= thresholds.tempMin && temp <= thresholds.tempMax) ? "normal" : "abnormal";
  
  // 火焰传感器
  int flameRaw = analogRead(FLAME_PIN);
  float flameIntensity = map(flameRaw, 0, 4095, 0, 100);
  JsonObject flameSensor = sensorData["flame_sensor"].to<JsonObject>();
  flameSensor["flame_detected"] = flameIntensity > thresholds.flameMin;
  flameSensor["flame_intensity"] = flameIntensity;
  
  // 烟雾传感器
  int smokeRaw = analogRead(SMOKE_PIN);
  float smokeConc = smokeRaw / 4095.0 * 1.0; // 简化计算，实际需要根据传感器规格
  JsonObject smokeSensor = sensorData["smoke_sensor"].to<JsonObject>();
  smokeSensor["smoke_concentration"] = smokeConc;
  smokeSensor["status"] = smokeConc <= thresholds.smokeMax ? "normal" : "abnormal";
  
  // 人体红外
  bool humanDetected = digitalRead(PIR_PIN) == HIGH;
  JsonObject humanInfrared = sensorData["human_infrared"].to<JsonObject>();
  humanInfrared["human_detected"] = humanDetected;
  humanInfrared["detection_distance"] = humanDetected ? 3 : 0; // 估算距离
  
  // MPU6050
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  
  float pitch = atan2(ay, az) * 180 / PI;
  float roll = atan2(ax, az) * 180 / PI;
  float yaw = atan2(gx, gz) * 180 / PI;
  
  JsonObject mpu6050 = sensorData["mpu6050"].to<JsonObject>();
  JsonObject eulerAngle = mpu6050["euler_angle"].to<JsonObject>();
  eulerAngle["pitch"] = pitch;
  eulerAngle["roll"] = roll;
  eulerAngle["yaw"] = yaw;
  mpu6050["calibration_status"] = mpuCalibrated ? "calibrated" : "uncalibrated";
  
  return sensorData;
}

// ==================== 获取阈值配置 ====================
JsonObject getThresholdConfig(JsonDocument& doc) {
  JsonObject config = doc["threshold_config"].to<JsonObject>();
  
  JsonObject tempThresh = config["temperature"].to<JsonObject>();
  tempThresh["min"] = thresholds.tempMin;
  tempThresh["max"] = thresholds.tempMax;
  
  JsonObject humiThresh = config["humidity"].to<JsonObject>();
  humiThresh["min"] = thresholds.humidityMin;
  humiThresh["max"] = thresholds.humidityMax;
  
  JsonObject smokeThresh = config["smoke_concentration"].to<JsonObject>();
  smokeThresh["max"] = thresholds.smokeMax;
  
  JsonObject flameThresh = config["flame_intensity"].to<JsonObject>();
  flameThresh["min"] = thresholds.flameMin;
  
  return config;
}

// ==================== HTTP 处理函数 ====================

// GET /data - 返回传感器数据
void handleGetData() {
  JsonDocument doc;
  
  // 设备信息
  JsonObject deviceInfo = doc["device_info"].to<JsonObject>();
  deviceInfo["device_id"] = deviceId;
  deviceInfo["factory_area"] = factoryArea;
  deviceInfo["timestamp"] = millis();
  deviceInfo["firmware_version"] = firmwareVersion;
  
  // 传感器数据
  readSensors(doc);
  
  // 阈值配置
  getThresholdConfig(doc);
  
  // 指令占位
  JsonObject cmd = doc["command"].to<JsonObject>();
  cmd["cmd_type"] = "none";
  cmd["cmd_id"] = "";
  cmd["params"].to<JsonObject>();
  cmd["cmd_response"] = nullptr;
  
  String response;
  serializeJson(doc, response);
  
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", response);
}

// POST /command - 接收并执行指令
void handleCommand() {
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"No body\"}");
    return;
  }
  
  String body = server.arg("plain");
  JsonDocument cmdDoc;
  DeserializationError error = deserializeJson(cmdDoc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }
  
  String cmdType = cmdDoc["cmd_type"];
  String cmdId = cmdDoc["cmd_id"];
  JsonObject params = cmdDoc["params"];
  
  JsonDocument responseDoc;
  JsonObject cmd = responseDoc["command"].to<JsonObject>();
  cmd["cmd_type"] = cmdType;
  cmd["cmd_id"] = cmdId;
  cmd["params"] = params;
  
  JsonObject cmdResponse = cmd["cmd_response"].to<JsonObject>();
  cmdResponse["execute_time"] = millis();
  
  // 执行指令
  bool success = true;
  String errorMsg = "";
  
  if (cmdType == "restart") {
    cmdResponse["status"] = "success";
    cmdResponse["error_msg"] = "";
    server.send(200, "application/json", responseDoc.as<String>());
    delay(1000);
    ESP.restart();
  }
  else if (cmdType == "calibrate") {
    String sensor = params["calibrate_sensor"] | "all";
    if (sensor == "mpu6050" || sensor == "all") {
      // MPU6050 校准逻辑
      mpuCalibrated = true;
      cmdResponse["status"] = "success";
      cmdResponse["error_msg"] = "";
    } else {
      success = false;
      errorMsg = "Unknown sensor: " + sensor;
    }
  }
  else if (cmdType == "set_threshold") {
    String threshType = params["threshold_type"];
    JsonObject newThresh = params["new_threshold"];
    
    if (threshType == "temperature") {
      thresholds.tempMin = newThresh["min"] | thresholds.tempMin;
      thresholds.tempMax = newThresh["max"] | thresholds.tempMax;
      cmdResponse["status"] = "success";
      cmdResponse["error_msg"] = "";
    }
    else if (threshType == "humidity") {
      thresholds.humidityMin = newThresh["min"] | thresholds.humidityMin;
      thresholds.humidityMax = newThresh["max"] | thresholds.humidityMax;
      cmdResponse["status"] = "success";
      cmdResponse["error_msg"] = "";
    }
    else if (threshType == "smoke_concentration") {
      thresholds.smokeMax = newThresh["max"] | thresholds.smokeMax;
      cmdResponse["status"] = "success";
      cmdResponse["error_msg"] = "";
    }
    else {
      success = false;
      errorMsg = "Unknown threshold type: " + threshType;
    }
  }
  else if (cmdType == "reset_alert") {
    // 重置报警状态
    cmdResponse["status"] = "success";
    cmdResponse["error_msg"] = "";
  }
  else {
    success = false;
    errorMsg = "Unknown command: " + cmdType;
  }
  
  if (!success) {
    cmdResponse["status"] = "failed";
    cmdResponse["error_msg"] = errorMsg;
  }
  
  // 返回设备信息
  JsonObject deviceInfo = responseDoc["device_info"].to<JsonObject>();
  deviceInfo["device_id"] = deviceId;
  deviceInfo["factory_area"] = factoryArea;
  deviceInfo["timestamp"] = millis();
  deviceInfo["firmware_version"] = firmwareVersion;
  
  // 返回最新传感器数据
  readSensors(responseDoc);
  
  String response;
  serializeJson(responseDoc, response);
  
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(success ? 200 : 400, "application/json", response);
}

// GET /health - 健康检查
void handleHealth() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"status\":\"ok\"}");
}
