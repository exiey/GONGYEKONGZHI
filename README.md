# 高危工程 IoT 监测系统

<div align="center">

[![Expo](https://img.shields.io/badge/Expo-54.0-black?logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue?logo=react)](https://reactnative.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-green?logo=express)](https://expressjs.com/)
[![OneNet](https://img.shields.io/badge/OneNet-IoT-orange)](https://open.iot.10086.cn/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

一套完整的物联网监测解决方案，覆盖 **传感器 → STM32 → ESP32C3 → 云平台 → 移动端 App** 全链路，专为高危工程场景设计，支持实时数据监测、远程任务下达、AI 智能分析和 OTA 热更新。

---

## 目录

- [系统架构](#系统架构)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [硬件配置](#硬件配置)
- [云平台配置](#云平台配置)
- [后端部署](#后端部署)
- [移动端使用](#移动端使用)
- [API 文档](#api-文档)
- [截图展示](#截图展示)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              系统整体架构                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    UART    ┌──────────────┐    WiFi     ┌──────────────┐
│              │ ─────────→ │              │ ──────────→ │              │
│   传感器层    │            │   传输层      │             │   云平台      │
│              │            │              │             │              │
│ • DHT11 温湿度│            │ • STM32F103  │             │ • OneNet     │
│ • MQ-2 烟雾   │            │ • ESP32C3    │             │ • 数据存储    │
│ • 火焰传感器  │            │ • WiFi 模组   │             │ • API 接口    │
│ • HC-SR501   │            │              │             │              │
│ • MPU6050    │            │              │             │              │
└──────────────┘            └──────────────┘             └──────────────┘
                                                              │
                                                              │ HTTP/WebSocket
                                                              ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                                  服务层                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Express API   │  │  WebSocket 服务  │  │   AI 分析服务   │              │
│  │                 │  │                 │  │                 │              │
│  │ • 数据接收       │  │ • 实时推送       │  │ • 风险评估      │              │
│  │ • 任务下达       │  │ • 心跳保活       │  │ • 智能建议      │              │
│  │ • OTA 更新      │  │ • 变化检测       │  │ • 流式输出      │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                              │                                               │
│                              ↓                                               │
│                    ┌─────────────────┐                                      │
│                    │    Supabase     │                                      │
│                    │   (PostgreSQL)  │                                      │
│                    └─────────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API / WebSocket
                              ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                              移动端 App                                       │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Dashboard │  │   Tasks     │  │     AI      │  │   Settings  │         │
│  │             │  │             │  │             │  │             │         │
│  │ • 实时监测   │  │ • 任务下达   │  │ • 智能分析   │  │ • WiFi 配置  │         │
│  │ • 状态显示   │  │ • OTA 更新   │  │ • 对话交互   │  │ • 阈值设置   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                              │
│                    Expo 54 + React Native + TypeScript                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 功能特性

### 核心功能

| 功能模块 | 描述 |
|---------|------|
| **实时监测** | 温湿度、烟雾浓度、火焰检测、人体红外、设备姿态等多维数据实时展示 |
| **WebSocket 推送** | 数据变化实时推送，延迟 <100ms，自动降级为 HTTP 轮询 |
| **任务下达** | 远程配置 WiFi、调整传感器阈值、重启设备、固件更新 |
| **AI 智能分析** | 基于大语言模型的风险评估、异常诊断、处置建议（流式输出）|
| **OTA 热更新** | 基于 Expo Updates，无需应用商店审核即可更新 JS 代码 |
| **多数据源支持** | ESP32 WiFi 直连优先，OneNet 云端备用，自动切换 |
| **暗色/亮色主题** | 跟随系统自动切换，保护用户视力 |

### 安全特性

- 高危区域人员入侵检测（PIR 红外）
- 烟雾/火焰实时报警
- 设备姿态异常监测（倾倒/震动）
- 阈值越限自动告警

---

## 技术栈

### 硬件层

| 组件 | 型号 | 用途 |
|------|------|------|
| 主控 MCU | STM32F103C8T6 | 传感器数据采集、协议转换 |
| WiFi 模组 | ESP32C3 | 网络通信、MQTT/HTTP 上报 |
| 温湿度传感器 | DHT11/DHT22 | 环境温湿度监测 |
| 烟雾传感器 | MQ-2 | 可燃气体/烟雾检测 |
| 火焰传感器 | 红外火焰传感器 | 明火检测 |
| 人体红外 | HC-SR501 | 人员入侵检测 |
| 姿态传感器 | MPU6050 | 设备倾角/震动监测 |

### 软件层

```
前端 (Mobile App)
├── Expo 54              # 跨平台开发框架
├── React Native 0.81    # 原生渲染引擎
├── TypeScript 5.x       # 类型安全
├── Expo Router          # 文件系统路由
├── React Native SSE     # 流式数据接收
└── AsyncStorage         # 本地持久化

后端 (Server)
├── Express.js           # Web 框架
├── WebSocket (ws)       # 实时通信
├── Supabase             # 数据库 (PostgreSQL)
├── coze-coding-sdk      # AI 大模型集成
└── OneNet API           # 物联网平台对接
```

---

## 项目结构

```
.
├── client/                    # 移动端应用 (Expo)
│   ├── app/                   # 路由配置 (Expo Router)
│   │   ├── (tabs)/            # Tab 导航页面
│   │   │   ├── index.tsx      # 首页 (Dashboard)
│   │   │   ├── tasks.tsx      # 任务管理
│   │   │   ├── ai.tsx         # AI 分析
│   │   │   └── settings.tsx   # 设置
│   │   └── _layout.tsx        # 根布局
│   ├── screens/               # 页面组件
│   ├── components/            # 通用组件
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useWebSocket.ts    # WebSocket 连接
│   │   ├── useTheme.ts        # 主题切换
│   │   └── ...
│   ├── constants/             # 常量定义
│   └── assets/                # 静态资源
│
├── server/                    # 后端服务 (Express)
│   ├── src/
│   │   ├── index.ts           # 入口文件
│   │   ├── routes/            # API 路由
│   │   │   ├── sensors.ts     # 传感器数据
│   │   │   ├── tasks.ts       # 任务管理
│   │   │   ├── ai.ts          # AI 分析
│   │   │   └── version.ts     # OTA 更新
│   │   ├── services/
│   │   │   ├── websocket.ts   # WebSocket 服务
│   │   │   └── onenet-cloud.ts# OneNet 对接
│   │   └── storage/
│   │       └── database/      # Supabase 客户端
│   └── package.json
│
├── hardware/                  # 硬件代码 (示例)
│   ├── stm32/                 # STM32 固件
│   └── esp32c3/               # ESP32 固件
│
├── .coze                      # 项目配置
├── pnpm-workspace.yaml        # Monorepo 配置
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Xcode (用于原生构建)

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/your-username/iot-monitoring-system.git
cd iot-monitoring-system

# 安装依赖
pnpm install
```

### 启动开发服务

```bash
# 启动后端
cd server
pnpm run dev

# 启动前端 (另一个终端)
cd client
npx expo start
```

### 扫码预览

使用 **Expo Go** App 扫描终端中的二维码，即可在手机上预览。

---

## 硬件配置

### STM32 引脚分配

| 传感器 | STM32 引脚 | 说明 |
|--------|-----------|------|
| DHT11 | PA0 | 单总线协议 |
| MQ-2 | PA1 | ADC 采集 |
| 火焰传感器 | PA2 | 数字输入 |
| HC-SR501 | PA3 | 数字输入 |
| MPU6050 SDA | PB6 | I2C |
| MPU6050 SCL | PB7 | I2C |
| ESP32C3 TX | PA9 | UART1_RX |
| ESP32C3 RX | PA10 | UART1_TX |

### ESP32C3 配置

ESP32C3 作为 WiFi 模组，通过 UART 与 STM32 通信：

```c
// ESP32C3 配置示例
#define WIFI_SSID "your_wifi_ssid"
#define WIFI_PASS "your_wifi_password"
#define ONENET_PRODUCT_ID "your_product_id"
#define ONENET_DEVICE_ID "your_device_id"
#define ONENET_ACCESS_KEY "your_access_key"
```

---

## 云平台配置

### OneNet 平台设置

1. 登录 [OneNet 平台](https://open.iot.10086.cn/)
2. 创建产品，选择 **MQTT 协议**
3. 添加设备，获取：
   - Product ID
   - Device ID
   - Access Key

### 物模型定义

| 标识符 | 名称 | 数据类型 | 读写权限 |
|--------|------|----------|----------|
| temperature | 温度 | float | 只读 |
| humidity | 湿度 | float | 只读 |
| smoke | 烟感 | bool | 只读 |
| flame | 焰火 | bool | 只读 |
| red | 红外 | bool | 只读 |
| posture | 机器姿态 | struct | 只读 |

### 后端环境变量

在 `server/.env` 中配置：

```env
# OneNet 配置
ONENET_PRODUCT_ID=your_product_id
ONENET_DEVICE_ID=your_device_id
ONENET_ACCESS_KEY=your_access_key

# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# AI 配置 (可选)
COZE_API_KEY=your_coze_api_key
```

---

## 后端部署

### 数据库初始化

```sql
-- 创建传感器数据表
CREATE TABLE sensor_data (
  id BIGSERIAL PRIMARY KEY,
  device_id VARCHAR(64) NOT NULL,
  temperature FLOAT,
  humidity FLOAT,
  smoke_level FLOAT,
  smoke_alert BOOLEAN DEFAULT FALSE,
  pir_detected BOOLEAN DEFAULT FALSE,
  flame_detected BOOLEAN DEFAULT FALSE,
  flame_intensity FLOAT,
  gyro_x FLOAT,
  gyro_y FLOAT,
  gyro_z FLOAT,
  device_status VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_sensor_data_device_id ON sensor_data(device_id);
CREATE INDEX idx_sensor_data_created_at ON sensor_data(created_at DESC);
```

### 生产部署

```bash
# 构建
cd server
pnpm run build

# 启动 (使用 PM2)
pm2 start dist/index.js --name iot-server
```

---

## 移动端使用

### 首页 (Dashboard)

- 实时显示传感器数据
- WebSocket 连接状态指示
- 数据变化实时刷新
- 下拉刷新

### 任务管理 (Tasks)

- WiFi 配置下发
- 传感器阈值调整
- 设备重启指令
- OTA 固件更新

### AI 分析 (AI)

- 当前状态风险评估
- 异常原因诊断
- 处置建议生成
- 流式对话交互

---

## API 文档

### 传感器数据

```http
GET /api/v1/sensors/latest
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "device_id": "esp32c3-001",
    "temperature": 25.6,
    "humidity": 45.2,
    "smoke_level": 0.02,
    "smoke_alert": false,
    "pir_detected": false,
    "flame_detected": false,
    "flame_intensity": 0,
    "gyro_x": 0.5,
    "gyro_y": -1.2,
    "gyro_z": 89.3,
    "device_status": "online",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### WebSocket 连接

```
ws://your-server:9091/ws/sensors
```

**消息格式：**
```json
{
  "type": "sensor_data",
  "data": { /* 传感器数据 */ },
  "timestamp": 1705312200000
}
```

### AI 分析

```http
POST /api/v1/ai/chat
Content-Type: application/json

{
  "message": "分析当前设备状态",
  "sensorData": { /* 当前传感器数据 */ }
}
```

**响应：** SSE 流式输出

---

## 截图展示

| Dashboard | Tasks | AI Analysis |
|-----------|-------|-------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Tasks](docs/screenshots/tasks.png) | ![AI](docs/screenshots/ai.png) |

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 致谢

- [Expo](https://expo.dev/) - 优秀的跨平台开发框架
- [OneNet](https://open.iot.10086.cn/) - 中国移动物联网平台
- [Supabase](https://supabase.com/) - 开源 Firebase 替代方案

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by IoT Enthusiasts

</div>
