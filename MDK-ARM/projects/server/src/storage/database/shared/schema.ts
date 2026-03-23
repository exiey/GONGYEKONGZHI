import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ==================== IoT 传感器数据表 ====================
export const sensorData = pgTable(
  "sensor_data",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    deviceId: varchar("device_id", { length: 64 }).notNull(),
    
    // 温湿度传感器
    temperature: real("temperature"),
    humidity: real("humidity"),
    
    // 烟感传感器
    smokeLevel: real("smoke_level"),
    smokeAlert: boolean("smoke_alert").default(false),
    
    // 人体红外传感器
    pirDetected: boolean("pir_detected").default(false),
    
    // 火焰传感器
    flameDetected: boolean("flame_detected").default(false),
    flameIntensity: real("flame_intensity"),
    
    // MPU6050 陀螺仪/加速度
    accelX: real("accel_x"),
    accelY: real("accel_y"),
    accelZ: real("accel_z"),
    gyroX: real("gyro_x"),
    gyroY: real("gyro_y"),
    gyroZ: real("gyro_z"),
    
    // 设备状态
    deviceStatus: varchar("device_status", { length: 20 }).default("online"),
    
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sensor_data_device_idx").on(table.deviceId),
    index("sensor_data_created_at_idx").on(table.createdAt),
  ]
);

// ==================== 设备任务表 ====================
export const deviceTasks = pgTable(
  "device_tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    deviceId: varchar("device_id", { length: 64 }).notNull(),
    
    // 任务类型：reboot（重启）、calibrate（校准）、set_threshold（设置阈值）、emergency_stop（紧急停止）
    taskType: varchar("task_type", { length: 32 }).notNull(),
    
    // 任务参数（JSON格式）
    params: jsonb("params"),
    
    // 任务状态：pending（待执行）、executed（已执行）、failed（失败）
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    
    // 执行结果
    result: text("result"),
    
    // 时间戳
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }),
  },
  (table) => [
    index("device_tasks_device_idx").on(table.deviceId),
    index("device_tasks_status_idx").on(table.status),
    index("device_tasks_created_at_idx").on(table.createdAt),
  ]
);

// ==================== 设备信息表 ====================
export const devices = pgTable(
  "devices",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    deviceId: varchar("device_id", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 128 }).notNull(),
    location: varchar("location", { length: 256 }),
    description: text("description"),
    status: varchar("status", { length: 20 }).default("online"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("devices_device_id_idx").on(table.deviceId),
  ]
);

// ==================== Zod Schemas ====================
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// 传感器数据
export const insertSensorDataSchema = createCoercedInsertSchema(sensorData).pick({
  deviceId: true,
  temperature: true,
  humidity: true,
  smokeLevel: true,
  smokeAlert: true,
  pirDetected: true,
  flameDetected: true,
  flameIntensity: true,
  accelX: true,
  accelY: true,
  accelZ: true,
  gyroX: true,
  gyroY: true,
  gyroZ: true,
  deviceStatus: true,
});

// 设备任务
export const insertDeviceTaskSchema = createCoercedInsertSchema(deviceTasks).pick({
  deviceId: true,
  taskType: true,
  params: true,
});

export const updateDeviceTaskSchema = createCoercedInsertSchema(deviceTasks)
  .pick({
    status: true,
    result: true,
    executedAt: true,
  })
  .partial();

// 设备信息
export const insertDeviceSchema = createCoercedInsertSchema(devices).pick({
  deviceId: true,
  name: true,
  location: true,
  description: true,
});

// ==================== TypeScript Types ====================
export type SensorData = typeof sensorData.$inferSelect;
export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;
export type DeviceTask = typeof deviceTasks.$inferSelect;
export type InsertDeviceTask = z.infer<typeof insertDeviceTaskSchema>;
export type UpdateDeviceTask = z.infer<typeof updateDeviceTaskSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
