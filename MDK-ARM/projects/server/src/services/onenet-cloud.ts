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

const DEFAULT_PRODUCT_ID = "fjIr89gNlc";
const DEFAULT_DEVICE_ID = "esp32c3-001";
const DEFAULT_ACCESS_KEY = "aWv7//1FoQFHCaV/MQk9D5m7VdmH/09rte8ROflNLdU=";
const DEFAULT_API_BASE = "https://iot-api.heclouds.com";
const TOKEN_VERSION = "2018-10-31";

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
    smoke_level: toBoolean(smokeText) ? 1 : toNumber(smokeText),
    smoke_alert: toBoolean(smokeText),
    pir_detected: toBoolean(redText),
    flame_detected: toBoolean(flameText),
    flame_intensity: toBoolean(flameText) ? 1 : toNumber(flameText),
    gyro_x: posture.pitch,
    gyro_y: posture.roll,
    gyro_z: posture.yaw,
    device_status: map.get("CollectionEquipmentStatus")?.value || "online",
    created_at: latestTime > 0 ? new Date(latestTime).toISOString() : new Date().toISOString(),
    source: "onenet_http",
    raw_payload: payload,
  };
}

export async function fetchLatestCloudSensorData(deviceId?: string): Promise<CloudSensorSnapshot | null> {
  const productId = process.env.ONENET_PRODUCT_ID || DEFAULT_PRODUCT_ID;
  const resolvedDeviceId = String(deviceId || process.env.ONENET_DEVICE_ID || DEFAULT_DEVICE_ID);
  const accessKey = process.env.ONENET_ACCESS_KEY || DEFAULT_ACCESS_KEY;
  const apiBase = process.env.ONENET_API_BASE || DEFAULT_API_BASE;
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
