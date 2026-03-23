import express from "express";
import type { Request, Response } from "express";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { fetchLatestCloudSensorData } from "@/services/onenet-cloud";

const router = express.Router();

/**
 * POST /api/v1/sensors/data
 * ESP32 上报传感器数据
 * Body: {
 *   deviceId: string,
 *   temperature?: number,
 *   humidity?: number,
 *   smokeLevel?: number,
 *   smokeAlert?: boolean,
 *   pirDetected?: boolean,
 *   flameDetected?: boolean,
 *   flameIntensity?: number,
 *   accelX?: number,
 *   accelY?: number,
 *   accelZ?: number,
 *   gyroX?: number,
 *   gyroY?: number,
 *   gyroZ?: number,
 *   deviceStatus?: string
 * }
 */
router.post("/data", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const data = req.body;

    // 插入传感器数据
    const { data: result, error } = await client
      .from("sensor_data")
      .insert({
        device_id: data.deviceId,
        temperature: data.temperature,
        humidity: data.humidity,
        smoke_level: data.smokeLevel,
        smoke_alert: data.smokeAlert,
        pir_detected: data.pirDetected,
        flame_detected: data.flameDetected,
        flame_intensity: data.flameIntensity,
        accel_x: data.accelX,
        accel_y: data.accelY,
        accel_z: data.accelZ,
        gyro_x: data.gyroX,
        gyro_y: data.gyroY,
        gyro_z: data.gyroZ,
        device_status: data.deviceStatus || "online",
      })
      .select()
      .single();

    if (error) {
      console.error("Insert sensor data error:", error);
      return res.status(500).json({ error: error.message });
    }

    // 更新设备的 last_seen_at
    await client
      .from("devices")
      .upsert({
        device_id: data.deviceId,
        name: `设备 ${data.deviceId.slice(-4)}`,
        last_seen_at: new Date().toISOString(),
        status: "online",
      })
      .select();

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("Sensor data upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/sensors/latest
 * 获取最新传感器数据（前端轮询）
 * Query: deviceId (可选，不传则获取所有设备的最新数据)
 */
router.get("/latest", async (req: Request, res: Response) => {
  try {
    const cloudData = await fetchLatestCloudSensorData(req.query.deviceId as string | undefined);
    if (cloudData) {
      return res.json({ data: cloudData, source: "onenet_http" });
    }
    try {
      const client = getSupabaseClient();
      const { deviceId } = req.query;

      let query = client
        .from("sensor_data")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (deviceId) {
        query = query.eq("device_id", deviceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Get latest data error:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.json({ data: data?.[0] || null, source: data?.[0] ? "supabase" : "none" });
    } catch (fallbackError) {
      console.error("Get latest data fallback error:", fallbackError);
      return res.json({ data: null, source: "none" });
    }
  } catch (error) {
    console.error("Get latest data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/sensors/history
 * 获取历史传感器数据
 * Query: deviceId (必需), limit (可选，默认50), offset (可选)
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { deviceId, limit = "50", offset = "0" } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const { data, error } = await client
      .from("sensor_data")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (error) {
      console.error("Get history data error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error("Get history data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/sensors/devices
 * 获取所有设备列表
 */
router.get("/devices", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from("devices")
      .select("*")
      .order("last_seen_at", { ascending: false });

    if (error) {
      console.error("Get devices error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error("Get devices error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
