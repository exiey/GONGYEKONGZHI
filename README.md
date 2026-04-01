# 工业监测控制系统

基于 `STM32 + ESP32(AT) + OneNET + Expo/React Native + Express` 的工业监测控制项目。

项目覆盖了从传感器采集、嵌入式控制、云端数据接入，到移动端展示与任务下发的完整链路，适合课程设计、毕业设计、IoT 综合实训和原型演示。

## 项目亮点

- 支持温湿度、烟雾、火焰、人体红外、姿态等多种传感器数据采集
- STM32 负责本地采集与任务调度，ESP32 通过 AT 指令完成联网
- 对接 OneNET，实现设备上云与属性上报
- 提供 Express 服务端，支持 HTTP API 与 WebSocket 实时推送
- 提供 Expo/React Native 移动端，用于监控、任务管理和 WiFi 配置
- 仓库中的敏感配置已替换为占位内容，适合公开发布到 GitHub

## 系统架构

```text
传感器 -> STM32F103 -> ESP32(AT) -> OneNET / Server -> Mobile App
```

数据流大致如下：

1. STM32 读取各类传感器数据
2. 通过串口控制 ESP32 连接 WiFi 并上报 OneNET
3. 服务端从 OneNET 拉取或转发数据
4. 移动端通过 HTTP / WebSocket 查看实时状态并下发配置

## 仓库结构

```text
.
├─ Core/                  STM32CubeMX 生成的核心代码
├─ app/                   业务层代码，包含采集、ESP-AT、OneNET 上报逻辑
├─ common/                通用组件
├─ inf/                   传感器驱动
├─ FreeRTOS/              FreeRTOS 相关代码
├─ Drivers/               STM32 HAL / CMSIS 驱动
├─ MDK-ARM/               Keil 工程及相关示例/备份文件
├─ projects/
│  ├─ client/             Expo / React Native 移动端
│  ├─ server/             Express 服务端
│  ├─ esp32/              ESP32 示例代码
│  └─ README.md           前后端子项目补充说明
└─ GONGYEKONGZHI.ioc      STM32CubeMX 工程文件
```

## 主要模块

### 1. STM32 固件

核心代码位于 `Core/` 和 `app/`。

- `app/onenet_at.c`：通过 ESP-AT 指令登录 OneNET 并发布数据
- `app/onenet_payload.c`：构造 OneNET 上报 payload
- `app/app_datacollect.c`：汇总传感器快照
- `app/App_Task.c`：FreeRTOS 任务创建与调度

### 2. ESP32 示例

示例文件位于 `projects/esp32/iot_monitor.ino`。

该示例可作为独立的 ESP32 AP + HTTP Server 版本进行调试，也可以作为功能演示代码参考。

### 3. 服务端

服务端位于 `projects/server/`，主要提供：

- `GET /api/v1/health` 健康检查
- `/api/v1/sensors` 传感器相关接口
- `/api/v1/tasks` 任务下发接口
- `/api/v1/ai` AI 分析接口
- `/api/v1/version` 版本与更新相关接口
- WebSocket 实时数据推送

默认监听端口可由 `PORT` 环境变量控制，当前代码默认值为 `9091`。

### 4. 移动端

移动端位于 `projects/client/`，使用：

- Expo 54
- React Native 0.81
- TypeScript
- Expo Router

当前项目中已经可以看到 Dashboard、Tasks、AI 等页面结构。

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 9+
- STM32CubeMX
- Keil MDK 或其他 STM32 编译环境
- Arduino IDE 或 PlatformIO（用于 ESP32 示例）

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/GONGYEKONGZHI.git
cd GONGYEKONGZHI
```

### 2. 安装前后端依赖

```bash
cd projects
pnpm install
```

### 3. 启动服务端

```bash
cd projects/server
pnpm run dev
```

### 4. 启动移动端

```bash
cd projects/client
pnpm start
```

### 5. 打开 STM32 工程

- 使用 `GONGYEKONGZHI.ioc` 在 STM32CubeMX 中查看或重新生成工程
- 使用 `MDK-ARM/` 中的工程文件在 Keil 中编译下载

## 配置说明

### STM32 / OneNET / WiFi

敏感配置文件位于：

- `app/onenet_at_config.h`
- `projects/esp32/iot_monitor.ino`

仓库中已经改成占位内容，你需要按自己的实际环境填写：

- WiFi 名称和密码
- OneNET 产品 ID
- OneNET 设备名称 / 设备 ID
- OneNET MQTT Token / AccessKey
- MQTT Host / Topic

### 服务端环境变量

参考文件：

- `projects/server/.env.example`

建议至少配置以下内容：

```env
ONENET_PRODUCT_ID=你的产品ID
ONENET_DEVICE_ID=你的设备ID
ONENET_ACCESS_KEY=你的AccessKey
ONENET_API_BASE=https://iot-api.heclouds.com

SUPABASE_URL=你的Supabase项目地址
SUPABASE_ANON_KEY=你的Supabase匿名Key
```

如果启用了 AI 相关能力，再补充对应服务的密钥。

## 适用场景

- 工业环境安全监测
- 实验室或仓库状态监测
- 嵌入式联网课程设计
- IoT 平台接入演示
- 移动端远程监控原型

## 上传 GitHub 前的建议

- 再次检查 `app/onenet_at_config.h` 是否仍为占位内容
- 确认 `projects/server/.env` 没有被提交
- 如果后续补充截图，建议放到 `docs/` 目录
- 如果准备给别人复现，建议再补一个 `LICENSE`

## 后续可完善方向

- 增加项目实物图、系统架构图、App 截图
- 补充 OneNET 物模型定义说明
- 补充数据库表结构和接口文档
- 增加部署脚本和打包说明
- 增加英文版 README

## 免责声明

本项目主要用于学习、课程设计、原型验证与技术交流。请根据实际工业环境要求补充安全策略、异常保护和生产级测试后再投入正式场景。
