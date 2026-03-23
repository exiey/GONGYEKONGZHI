import React, { useState, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';

const DEFAULT_ESP32_IP = '192.168.4.1';
const DEFAULT_PORT = '80';

// 任务类型定义
const TASK_TYPES = [
  {
    type: 'restart',
    title: '重启设备',
    desc: '远程重启 ESP32 设备',
    icon: 'refresh-cw' as const,
    params: { restart_delay: 5 },
  },
  {
    type: 'calibrate',
    title: '校准传感器',
    desc: '校准 MPU6050 陀螺仪',
    icon: 'crosshair' as const,
    params: { calibrate_sensor: 'mpu6050' },
  },
  {
    type: 'set_threshold',
    title: '设置阈值',
    desc: '调整传感器报警阈值',
    icon: 'sliders' as const,
    params: { threshold_type: 'temperature', new_threshold: { min: -10, max: 60 } },
  },
  {
    type: 'reset_alert',
    title: '重置报警',
    desc: '清除当前报警状态',
    icon: 'bell-off' as const,
    params: {},
  },
];

// 指令历史记录
interface CommandHistory {
  cmd_id: string;
  cmd_type: string;
  params: any;
  status: 'pending' | 'success' | 'failed';
  error_msg?: string;
  execute_time?: number;
  timestamp: number;
}

export default function TasksScreen() {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const [esp32IP, setEsp32IP] = useState(DEFAULT_ESP32_IP);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<typeof TASK_TYPES[0] | null>(null);
  
  // 阈值设置表单
  const [thresholdType, setThresholdType] = useState('temperature');
  const [thresholdMin, setThresholdMin] = useState('-10');
  const [thresholdMax, setThresholdMax] = useState('60');

  // 检查连接状态
  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`http://${esp32IP}:${DEFAULT_PORT}/data`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      setConnectionStatus(response.ok ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkConnection();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // 生成指令ID
  const generateCmdId = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8);
    return `cmd_${dateStr}_${random}`;
  };

  // 发送指令到 ESP32
  const sendCommand = async (taskType: string, params: any) => {
    const cmdId = generateCmdId();
    
    const commandPayload = {
      cmd_type: taskType,
      cmd_id: cmdId,
      params: params,
    };

    // 添加到历史记录
    const newHistoryItem: CommandHistory = {
      cmd_id: cmdId,
      cmd_type: taskType,
      params: params,
      status: 'pending',
      timestamp: Date.now(),
    };
    setCommandHistory(prev => [newHistoryItem, ...prev]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // 发送指令到 ESP32
      const response = await fetch(`http://${esp32IP}:${DEFAULT_PORT}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commandPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        
        // 更新历史记录
        setCommandHistory(prev => 
          prev.map(item => 
            item.cmd_id === cmdId 
              ? { 
                  ...item, 
                  status: result.command?.cmd_response?.status || 'success',
                  error_msg: result.command?.cmd_response?.error_msg,
                  execute_time: result.command?.cmd_response?.execute_time,
                } 
              : item
          )
        );

        if (result.command?.cmd_response?.status === 'success') {
          Alert.alert('成功', '指令已执行');
        } else {
          Alert.alert('失败', result.command?.cmd_response?.error_msg || '指令执行失败');
        }
      } else {
        // ESP32 返回错误
        setCommandHistory(prev => 
          prev.map(item => 
            item.cmd_id === cmdId 
              ? { ...item, status: 'failed', error_msg: `HTTP ${response.status}` } 
              : item
          )
        );
        Alert.alert('错误', `ESP32 返回 HTTP ${response.status}`);
      }
    } catch (error) {
      // 网络错误
      setCommandHistory(prev => 
        prev.map(item => 
          item.cmd_id === cmdId 
            ? { ...item, status: 'failed', error_msg: '网络连接失败' } 
            : item
        )
      );
      
      // 尝试发送到云端
      await sendCommandToCloud(cmdId, taskType, params);
    }
  };

  // 发送指令到云端（备选方案）
  const sendCommandToCloud = async (cmdId: string, taskType: string, params: any) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
      const response = await fetch(`${backendUrl}/api/v1/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'ESP32-C3-001',
          taskType: taskType,
          params: params,
        }),
      });

      if (response.ok) {
        Alert.alert('已缓存', '指令已保存到云端，等待设备同步');
      } else {
        Alert.alert('错误', '无法发送指令');
      }
    } catch (error) {
      Alert.alert('错误', '网络连接失败');
    }
  };

  // 打开任务详情模态框
  const openTaskModal = (task: typeof TASK_TYPES[0]) => {
    setSelectedTask(task);
    if (task.type === 'set_threshold') {
      setThresholdType('temperature');
      setThresholdMin('-10');
      setThresholdMax('60');
    }
    setModalVisible(true);
  };

  // 执行任务
  const executeTask = () => {
    if (!selectedTask) return;

    let params = { ...selectedTask.params };

    if (selectedTask.type === 'set_threshold') {
      params = {
        threshold_type: thresholdType,
        new_threshold: {
          min: parseFloat(thresholdMin),
          max: parseFloat(thresholdMax),
        },
      };
    }

    sendCommand(selectedTask.type, params);
    setModalVisible(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTaskTypeInfo = (taskType: string) => {
    return TASK_TYPES.find(t => t.type === taskType) || { title: taskType, icon: 'circle' as const };
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { style: any; textStyle: any; text: string }> = {
      pending: { style: styles.statusPending, textStyle: styles.statusTextPending, text: '待执行' },
      success: { style: styles.statusExecuted, textStyle: styles.statusTextExecuted, text: '成功' },
      failed: { style: styles.statusFailed, textStyle: styles.statusTextFailed, text: '失败' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <View style={[styles.statusBadge, config.style]}>
        <ThemedText variant="tiny" style={config.textStyle}>{config.text}</ThemedText>
      </View>
    );
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h1" style={styles.headerTitle}>
            任务管理
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.headerSubtitle}>
            向设备下达控制指令
          </ThemedText>

          {/* 连接状态 */}
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot,
              connectionStatus === 'connected' ? styles.connectionDotConnected : styles.connectionDotDisconnected
            ]} />
            <ThemedText variant="caption" color={theme.textMuted}>
              {connectionStatus === 'connected' ? `已连接 ${esp32IP}` : 'ESP32 未连接'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* 任务类型 */}
        <ThemedView level="root" style={styles.section}>
          <ThemedText variant="labelSmall" color={theme.textMuted} style={styles.sectionTitle}>
            下达指令
          </ThemedText>
          {TASK_TYPES.map((task) => (
            <TouchableOpacity
              key={task.type}
              style={styles.taskButton}
              onPress={() => openTaskModal(task)}
            >
              <View style={styles.taskButtonIcon}>
                <Feather name={task.icon} size={20} color={theme.textPrimary} />
              </View>
              <View style={styles.taskButtonContent}>
                <ThemedText variant="bodyMedium" style={styles.taskButtonTitle}>
                  {task.title}
                </ThemedText>
                <ThemedText variant="small" color={theme.textMuted}>
                  {task.desc}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textMuted} style={styles.taskButtonArrow} />
            </TouchableOpacity>
          ))}
        </ThemedView>

        {/* 指令历史 */}
        {commandHistory.length > 0 && (
          <ThemedView level="root" style={styles.section}>
            <ThemedText variant="labelSmall" color={theme.textMuted} style={styles.sectionTitle}>
              指令历史
            </ThemedText>
            
            {commandHistory.map((cmd) => {
              const typeInfo = getTaskTypeInfo(cmd.cmd_type);
              return (
                <View key={cmd.cmd_id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyTitle}>
                      <View style={styles.historyIconContainer}>
                        <Feather name={typeInfo.icon} size={16} color={theme.textPrimary} />
                      </View>
                      <ThemedText variant="bodyMedium">{typeInfo.title}</ThemedText>
                    </View>
                    {renderStatusBadge(cmd.status)}
                  </View>
                  <View style={styles.historyMeta}>
                    <View style={styles.historyMetaItem}>
                      <Feather name="clock" size={12} color={theme.textMuted} />
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {formatTime(cmd.timestamp)}
                      </ThemedText>
                    </View>
                    <View style={styles.historyMetaItem}>
                      <Feather name="hash" size={12} color={theme.textMuted} />
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {cmd.cmd_id.slice(-8)}
                      </ThemedText>
                    </View>
                  </View>
                  {cmd.error_msg && (
                    <View style={[styles.cmdResponse, styles.cmdResponseFailed]}>
                      <ThemedText variant="caption" color="#991B1B">{cmd.error_msg}</ThemedText>
                    </View>
                  )}
                </View>
              );
            })}
          </ThemedView>
        )}
      </ScrollView>

      {/* 任务确认模态框 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText variant="h3" style={styles.modalTitle}>
              {selectedTask?.title}
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary}>
              {selectedTask?.desc}
            </ThemedText>

            {selectedTask?.type === 'set_threshold' && (
              <View style={{ marginTop: 20 }}>
                <View style={styles.inputContainer}>
                  <ThemedText variant="labelSmall" color={theme.textMuted}>阈值类型</ThemedText>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {['temperature', 'humidity', 'smoke_concentration'].map(type => (
                      <TouchableOpacity
                        key={type}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          backgroundColor: thresholdType === type ? theme.primary : theme.backgroundTertiary,
                        }}
                        onPress={() => setThresholdType(type)}
                      >
                        <ThemedText 
                          variant="small" 
                          color={thresholdType === type ? theme.buttonPrimaryText : theme.textPrimary}
                        >
                          {type === 'temperature' ? '温度' : type === 'humidity' ? '湿度' : '烟雾'}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <ThemedText variant="labelSmall" color={theme.textMuted}>最小值</ThemedText>
                    <TextInput
                      style={styles.input}
                      value={thresholdMin}
                      onChangeText={setThresholdMin}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <ThemedText variant="labelSmall" color={theme.textMuted}>最大值</ThemedText>
                    <TextInput
                      style={styles.input}
                      value={thresholdMax}
                      onChangeText={setThresholdMax}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText variant="bodyMedium">取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={executeTask}
              >
                <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>确认执行</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
