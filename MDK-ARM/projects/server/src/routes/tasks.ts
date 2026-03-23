import express from "express";
import type { Request, Response } from "express";
import { getSupabaseClient } from "@/storage/database/supabase-client";

const router = express.Router();

// 任务类型定义
const TASK_TYPES = [
  "reboot", // 重启设备
  "calibrate", // 校准传感器
  "set_threshold", // 设置阈值
  "emergency_stop", // 紧急停止
  "reset_alert", // 重置报警
];

/**
 * POST /api/v1/tasks
 * 创建设备任务（前端下达指令）
 * Body: {
 *   deviceId: string,
 *   taskType: "reboot" | "calibrate" | "set_threshold" | "emergency_stop" | "reset_alert",
 *   params?: object
 * }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { deviceId, taskType, params } = req.body;

    // 验证必填字段
    if (!deviceId || !taskType) {
      return res.status(400).json({ error: "deviceId and taskType are required" });
    }

    // 验证任务类型
    if (!TASK_TYPES.includes(taskType)) {
      return res.status(400).json({
        error: `Invalid taskType. Must be one of: ${TASK_TYPES.join(", ")}`,
      });
    }

    // 创建任务
    const { data, error } = await client
      .from("device_tasks")
      .insert({
        device_id: deviceId,
        task_type: taskType,
        params: params || {},
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Create task error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/tasks/pending
 * 获取待执行任务（ESP32 轮询）
 * Query: deviceId (必需)
 */
router.get("/pending", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { deviceId } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const { data, error } = await client
      .from("device_tasks")
      .select("*")
      .eq("device_id", deviceId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Get pending tasks error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error("Get pending tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/v1/tasks/:taskId/execute
 * 标记任务为已执行（ESP32 调用）
 * Body: { result?: string }
 */
router.put("/:taskId/execute", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { taskId } = req.params;
    const { result } = req.body;

    const { data, error } = await client
      .from("device_tasks")
      .update({
        status: "executed",
        result: result || "Task executed successfully",
        executed_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Execute task error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Execute task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/v1/tasks/:taskId/fail
 * 标记任务为失败（ESP32 调用）
 * Body: { result?: string }
 */
router.put("/:taskId/fail", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { taskId } = req.params;
    const { result } = req.body;

    const { data, error } = await client
      .from("device_tasks")
      .update({
        status: "failed",
        result: result || "Task execution failed",
        executed_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Fail task error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Fail task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/tasks/history
 * 获取任务历史记录（前端展示）
 * Query: deviceId (可选), status (可选), limit (可选，默认50)
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();
    const { deviceId, status, limit = "50" } = req.query;

    let query = client
      .from("device_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(parseInt(limit as string));

    if (deviceId) {
      query = query.eq("device_id", deviceId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get task history error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error("Get task history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/tasks/stats
 * 获取任务统计信息
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const client = getSupabaseClient();

    // 获取各状态任务数量
    const { count: pendingCount, error: pendingError } = await client
      .from("device_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: executedCount, error: executedError } = await client
      .from("device_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "executed");

    const { count: failedCount, error: failedError } = await client
      .from("device_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    if (pendingError || executedError || failedError) {
      console.error("Get task stats error:", { pendingError, executedError, failedError });
      return res.status(500).json({ error: "Failed to get stats" });
    }

    res.json({
      data: {
        pending: pendingCount || 0,
        executed: executedCount || 0,
        failed: failedCount || 0,
      },
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
