import crypto from "node:crypto";

type OneNetPropertyItem = {
  identifier: string;
  time?: number;
  value?: string;
  data_type?: string;
};

type OneNetPropertyResponse = {
  code: number;
  data?: OneNetPropertyItem[];
  msg?: string;
  request_id?: string;
};

export type CloudSensorSnapshot = {
  device_id: string;
  temperature: number;
  humidity: number;
  smoke_level: number;
  smoke_alert: boolean;
  pir_detected: boolean;
  flame_detected: boolean;
  flame_intensity: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  device_status: string;
  created_at: string;
  source: "onenet_http";
  raw_payload: OneNetPropertyResponse;
};

const DEFAULT_API_BASE = "https://iot-api.heclouds.com";
const TOKEN_VERSION = "2018-10-31";

// 部署前请配置环境变量：
// ONENET_PRODUCT_ID=你的产品ID
// ONENET_DEVICE_ID=你的设备ID  
// ONENET_ACCESS_KEY=你的AccessKey
// ONENET_API_BASE=https://iot-api.heclouds.com

function toBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ["1", "true", "on", "yes"].includes(value.toLowerCase());
}

function toNumber(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildOneNetToken(productId: string, accessKey: string, expireTs: number): string {
  const resource = `products/${productId}`;
  const methods = ["md5", "sha1"] as const;

  for (const method of methods) {
    const signContent = `${expireTs}\n${method}\n${resource}\n${TOKEN_VERSION}`;
    const key = Buffer.from(accessKey, "base64");
    const sign = crypto.createHmac(method, key).update(signContent, "utf8").digest("base64");
    const token = [
      `version=${TOKEN_VERSION}`,
      `res=${encodeURIComponent(resource)}`,
      `et=${expireTs}`,
      `method=${method}`,
      `sign=${encodeURIComponent(sign)}`,
    ].join("&");

    if (method === "md5") {
      return token;
    }
  }

  throw new Error("failed to build onenet token");
}

function parsePosture(value: string | undefined): { pitch: number; roll: number; yaw: number } {
  if (!value) {
    return { pitch: 0, roll: 0, yaw: 0 };
  }

  try {
    const parsed = JSON.parse(value) as { pitch?: number; roll?: number; yaw?: number };
    return {
      pitch: typeof parsed.pitch === "number" ? parsed.pitch : 0,
      roll: typeof parsed.roll === "number" ? parsed.roll : 0,
      yaw: typeof parsed.yaw === "number" ? parsed.yaw : 0,
    };
  } catch {
    return { pitch: 0, roll: 0, yaw: 0 };
  }
}

function normalizePropertyList(deviceId: string, payload: OneNetPropertyResponse): CloudSensorSnapshot {
  const items = payload.data ?? [];
  const map = new Map(items.map((item) => [item.identifier, item]));
  const posture = parsePosture(map.get("posture")?.value);
  const smokeText = map.get("smoke")?.value;
  const flameText = map.get("flame")?.value;
  const redText = map.get("red")?.value;
  const latestTime = items.reduce((max, item) => Math.max(max, item.time ?? 0), 0);

  return {
    device_id: deviceId,
    temperature: toNumber(map.get("temperature")?.value),
    humidity: toNumber(map.get("humidity")?.value),
    // 烟雾传感器：bool 类型，true = 检测到烟雾
    smoke_alert: toBoolean(smokeText),
    smoke_level: toBoolean(smokeText) ? 1 : 0,
    // 人体红外：bool 类型
    pir_detected: toBoolean(redText),
    // 火焰传感器：bool 类型
    flame_detected: toBoolean(flameText),
    flame_intensity: toBoolean(flameText) ? 1 : 0,
    gyro_x: posture.pitch,
    gyro_y: posture.roll,
    gyro_z: posture.yaw,
    device_status: (() => {
      const statusValue = map.get("CollectionEquipmentStatus")?.value;
      // OneNet: "0" = 正常, "1" = 通信失败
      return statusValue === "0" ? "online" : statusValue === "1" ? "offline" : "online";
    })(),
    created_at: latestTime > 0 ? new Date(latestTime).toISOString() : new Date().toISOString(),
    source: "onenet_http",
    raw_payload: payload,
  };
}

export async function fetchLatestCloudSensorData(deviceId?: string): Promise<CloudSensorSnapshot | null> {
  // 从环境变量读取配置（部署时必须配置）
  const productId = process.env.ONENET_PRODUCT_ID;
  const accessKey = process.env.ONENET_ACCESS_KEY;
  const apiBase = process.env.ONENET_API_BASE || "https://iot-api.heclouds.com";
  const resolvedDeviceId = String(deviceId || process.env.ONENET_DEVICE_ID);

  // 检查必要配置
  if (!productId || !accessKey || !resolvedDeviceId) {
    console.error("[onenet] 缺少必要配置: ONENET_PRODUCT_ID, ONENET_DEVICE_ID, ONENET_ACCESS_KEY");
    return null;
  }

  const expireTs = Math.floor(Date.now() / 1000) + 3600;
  const authorization = buildOneNetToken(productId, accessKey, expireTs);
  const url = new URL("/thingmodel/query-device-property", apiBase);

  url.searchParams.set("product_id", productId);
  url.searchParams.set("device_name", resolvedDeviceId);

  const response = await fetch(url, {
    headers: {
      Authorization: authorization,
    },
  });

  const payload = (await response.json()) as OneNetPropertyResponse;
  if (!response.ok || payload.code !== 0 || !payload.data) {
    console.error("[onenet] query-device-property failed:", payload);
    return null;
  }

  return normalizePropertyList(resolvedDeviceId, payload);
}

/**
 * 向 OneNet 设备写入属性
 * @param params 属性参数对象，如 { ssid: "WiFi名称", sspassword: "WiFi密码" }
 * @param deviceId 设备ID（可选，默认使用环境变量）
 */
export async function setDeviceProperty(
  params: Record<string, string | number | boolean>,
  deviceId?: string
): Promise<{ success: boolean; message: string }> {
  const productId = process.env.ONENET_PRODUCT_ID;
  const accessKey = process.env.ONENET_ACCESS_KEY;
  const apiBase = process.env.ONENET_API_BASE || "https://iot-api.heclouds.com";
  const resolvedDeviceId = String(deviceId || process.env.ONENET_DEVICE_ID);

  // 检查必要配置
  if (!productId || !accessKey || !resolvedDeviceId) {
    console.error("[onenet] 缺少必要配置");
    return { success: false, message: "服务端配置缺失" };
  }

  const expireTs = Math.floor(Date.now() / 1000) + 3600;
  const authorization = buildOneNetToken(productId, accessKey, expireTs);
  const url = new URL("/thingmodel/set-device-property", apiBase);

  // 构建请求体
  const body = {
    product_id: productId,
    device_name: resolvedDeviceId,
    params: params,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json() as { code?: number; msg?: string };
    
    if (!response.ok || result.code !== 0) {
      console.error("[onenet] set-device-property failed:", result);
      return { success: false, message: result.msg || "设置失败" };
    }

    return { success: true, message: "设置成功" };
  } catch (error) {
    console.error("[onenet] set-device-property error:", error);
    return { success: false, message: "网络错误" };
  }
}
