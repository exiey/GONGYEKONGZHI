import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

// 当前 App 版本（部署时更新）
const CURRENT_VERSION = "1.0.0";
const VERSION_HISTORY = [
  {
    version: "1.0.0",
    date: "2025-01-20",
    changes: ["初始版本", "IoT 监测功能", "AI 智能分析", "任务下达"],
  },
];

/**
 * GET /api/v1/version/check
 * 检查是否有新版本
 * Query: currentVersion (客户端当前版本)
 */
router.get("/check", async (req: Request, res: Response) => {
  try {
    const clientVersion = req.query.currentVersion as string || "0.0.0";
    const latestVersion = VERSION_HISTORY[0];

    // 比较版本号
    const needsUpdate = compareVersions(latestVersion.version, clientVersion) > 0;

    res.json({
      currentVersion: clientVersion,
      latestVersion: latestVersion.version,
      needsUpdate,
      releaseDate: latestVersion.date,
      releaseNotes: latestVersion.changes,
      // 更新地址（可以是 App Store、Google Play 或 OTA 地址）
      updateUrl: process.env.APP_UPDATE_URL || "",
      // 是否强制更新
      forceUpdate: false,
    });
  } catch (error) {
    console.error("Version check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/version/history
 * 获取版本历史
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    res.json({
      currentVersion: CURRENT_VERSION,
      history: VERSION_HISTORY,
    });
  } catch (error) {
    console.error("Get version history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * 比较版本号
 * @returns 1: v1 > v2, -1: v1 < v2, 0: v1 == v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export default router;
