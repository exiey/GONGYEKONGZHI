import express from "express";
import type { Request, Response } from "express";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

const router = express.Router();

// IoT 监测智能体系统提示词
const IOT_AGENT_SYSTEM_PROMPT = `你是一个专业的 IoT 设备监测智能体，负责分析高危工程环境中的传感器数据，并为用户提供安全建议。

## 你的职责
1. **数据分析**：分析温湿度、烟雾、火焰、人体红外、MPU6050陀螺仪等传感器数据
2. **风险评估**：判断当前环境是否存在安全隐患
3. **预警建议**：当检测到异常时，提供具体的处理建议
4. **智能问答**：回答用户关于设备状态、安全规程、操作方法等问题

## 数据解读指南
- **温度**：正常范围 -10°C ~ 60°C，超出范围需要关注
- **湿度**：正常范围 10% ~ 95%，过高可能导致设备故障
- **烟雾浓度**：超过 0.1 mg/m³ 触发报警
- **火焰检测**：检测到火焰立即预警
- **人体红外**：检测到人员活动时记录
- **MPU6050**：监控设备倾斜/震动，可能表示结构问题

## 回答风格
- 简洁专业，突出关键信息
- 发现异常时使用 ⚠️ 标记
- 使用 emoji 增强可读性
- 提供具体可执行的建议

## 当前传感器数据
\`\`\`json
{{SENSOR_DATA}}
\`\`\`

请根据上述数据回答用户的问题。如果数据为空，说明设备未连接，请提示用户检查设备状态。`;

// 存储对话历史（简单实现，生产环境应使用数据库）
const conversationHistories: Map<string, Array<{ role: "user" | "assistant"; content: string }>> = new Map();

/**
 * POST /api/v1/ai/chat
 * AI 智能体对话接口（流式输出）
 * Body: {
 *   message: string,
 *   sensorData: object (传感器数据),
 *   sessionId: string (会话ID，可选)
 * }
 */
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, sensorData, sessionId = "default" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // 设置 SSE 响应头
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, no-transform, must-revalidate");
    res.setHeader("Connection", "keep-alive");

    // 初始化 LLM 客户端
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建系统提示词（包含传感器数据）
    const systemPrompt = IOT_AGENT_SYSTEM_PROMPT.replace(
      "{{SENSOR_DATA}}",
      sensorData ? JSON.stringify(sensorData, null, 2) : "暂无数据"
    );

    // 获取或创建对话历史
    if (!conversationHistories.has(sessionId)) {
      conversationHistories.set(sessionId, []);
    }
    const history = conversationHistories.get(sessionId)!;

    // 构建消息列表
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    // 调用 LLM 流式输出
    const stream = client.stream(messages, {
      model: "doubao-seed-1-6-251015",
      temperature: 0.7,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      if (chunk.content) {
        const text = chunk.content.toString();
        fullResponse += text;
        // SSE 格式发送
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // 保存对话历史（保留最近 10 轮）
    history.push({ role: "user", content: message });
    history.push({ role: "assistant", content: fullResponse });
    if (history.length > 20) {
      history.splice(0, 2);
    }

    // 发送结束标记
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("AI chat error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
      res.end();
    }
  }
});

/**
 * POST /api/v1/ai/analyze
 * AI 分析当前传感器状态（快速分析）
 * Body: { sensorData: object }
 */
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { sensorData } = req.body;

    if (!sensorData) {
      return res.status(400).json({ error: "sensorData is required" });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const analyzePrompt = `请分析以下 IoT 传感器数据，给出简短的安全状态评估（100字以内）：

${JSON.stringify(sensorData, null, 2)}

请按以下格式回答：
状态：[正常/警告/危险]
摘要：[一句话描述]
建议：[如有异常，给出建议]`;

    const messages = [{ role: "user" as const, content: analyzePrompt }];

    const response = await client.invoke(messages, {
      model: "doubao-seed-1-6-lite-251015",
      temperature: 0.3,
    });

    res.json({ analysis: response.content });
  } catch (error) {
    console.error("AI analyze error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/v1/ai/history/:sessionId
 * 清除对话历史
 */
router.delete("/history/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;
  conversationHistories.delete(sessionId as string);
  res.json({ success: true });
});

export default router;
