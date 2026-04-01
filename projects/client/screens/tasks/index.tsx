import React, { useState, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useOTAUpdate } from '@/hooks/useOTAUpdate';
import { createStyles } from './styles';

const DEFAULT_ESP32_IP = '192.168.4.1';
const DEFAULT_PORT = '80';
const CURRENT_APP_VERSION = '1.0.0';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

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

// 版本信息
interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
  releaseDate: string;
  releaseNotes: string[];
  updateUrl: string;
  forceUpdate: boolean;
}

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
  
  // WiFi 配置
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSubmitting, setWifiSubmitting] = useState(false);
  
  // OTA 热更新
  const otaUpdate = useOTAUpdate();
  
  // 版本更新（服务端记录）
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [versionChecking, setVersionChecking] = useState(false);

  // 阈值设置表单
  const [thresholdType, setThresholdType] = useState('temperature');
  const [thresholdMin, setThresholdMin] = useState('-10');
  const [thresholdMax, setThresholdMax] = useState('60');

  // 检查版本更新（服务端记录）
  const checkVersionUpdate = async () => {
    setVersionChecking(true);
    try {
      /**
       * 服务端文件：server/src/routes/version.ts
       * 接口：GET /api/v1/version/check
       * Query 参数：currentVersion: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/version/check?currentVersion=${CURRENT_APP_VERSION}`);
      const data = await response.json();
      setVersionInfo(data);
    } catch (error) {
      console.error('Version check error:', error);
    } finally {
      setVersionChecking(false);
    }
  };
  
  // 执行 OTA 更新
  const handleOTAUpdate = async () => {
    if (!otaUpdate.isOTASupported) {
      Alert.alert(
        'OTA 热更新',
        '当前为开发模式或 Web 端，不支持 OTA 更新。\n\n' +
        '发布后的 App 会自动检查并下载更新，用户下次启动时生效。'
      );
      return;
    }
    await otaUpdate.performUpdate();
  };

  // 提交 WiFi 配置到 OneNet
  const submitWifiConfig = async () => {
    if (!wifiSSID.trim() || !wifiPassword.trim()) {
      Alert.alert('提示', '请输入 WiFi 名称和密码');
      return;
    }

    setWifiSubmitting(true);
    try {
      /**
       * 服务端文件：server/src/routes/sensors.ts
       * 接口：POST /api/v1/sensors/wifi-config
       * Body 参数：ssid: string, password: string, deviceId?: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/sensors/wifi-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssid: wifiSSID.trim(),
          password: wifiPassword.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', 'WiFi 配置已下发，设备将自动连接');
        setWifiSSID('');
        setWifiPassword('');
      } else {
        Alert.alert('失败', result.error || '配置下发失败');
      }
    } catch (error) {
      Alert.alert('错误', '网络连接失败');
    } finally {
      setWifiSubmitting(false);
    }
  };

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
      checkVersionUpdate();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // 生成指令ID
  const generateCmdId = () => {
    const counter = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `cmd_${counter}_${random}`;
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
        setCommandHistory(prev => 
          prev.map(item => 
            item.cmd_id === cmdId 
              ? { ...item, status: 'failed', error_msg: `HTTP ${response.status}` } 
              : item
          )
        );
        Alert.alert('错误', `ESP32 返回 HTTP ${response.status}`);
      }
    } catch {
      setCommandHistory(prev => 
        prev.map(item => 
          item.cmd_id === cmdId 
            ? { ...item, status: 'failed', error_msg: '网络连接失败' } 
            : item
        )
      );
      await sendCommandToCloud(cmdId, taskType, params);
    }
  };

  // 发送指令到云端（备选方案）
  const sendCommandToCloud = async (cmdId: string, taskType: string, params: any) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/tasks`, {
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
    } catch {
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

        {/* WiFi 配置 */}
        <ThemedView level="root" style={styles.section}>
          <ThemedText variant="labelSmall" color={theme.textMuted} style={styles.sectionTitle}>
            WiFi 配置
          </ThemedText>
          
          <View style={styles.wifiCard}>
            <View style={styles.wifiCardHeader}>
              <View style={styles.wifiCardIcon}>
                <Feather name="wifi" size={20} color={theme.textPrimary} />
              </View>
              <View>
                <ThemedText variant="bodyMedium">配置设备 WiFi</ThemedText>
                <ThemedText variant="small" color={theme.textMuted}>
                  上传到 OneNet，设备自动连接
                </ThemedText>
              </View>
            </View>
            
            <TextInput
              style={styles.wifiInput}
              placeholder="WiFi 名称 (SSID)"
              placeholderTextColor={theme.textMuted}
              value={wifiSSID}
              onChangeText={setWifiSSID}
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.wifiInput}
              placeholder="WiFi 密码"
              placeholderTextColor={theme.textMuted}
              value={wifiPassword}
              onChangeText={setWifiPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={styles.wifiButton}
              onPress={submitWifiConfig}
              disabled={wifiSubmitting}
            >
              {wifiSubmitting ? (
                <ActivityIndicator color={theme.buttonPrimaryText} />
              ) : (
                <ThemedText variant="bodyMedium" style={styles.wifiButtonText}>
                  登录并上传
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* 版本更新 */}
        <ThemedView level="root" style={styles.section}>
          <ThemedText variant="labelSmall" color={theme.textMuted} style={styles.sectionTitle}>
            软件更新
          </ThemedText>
          
          <View style={styles.versionCard}>
            <View style={styles.versionHeader}>
              <View style={styles.versionInfo}>
                <View style={styles.versionIcon}>
                  <Feather name="smartphone" size={20} color={theme.textPrimary} />
                </View>
                <View>
                  <ThemedText variant="bodyMedium">当前版本</ThemedText>
                  <ThemedText variant="h4">v{CURRENT_APP_VERSION}</ThemedText>
                </View>
              </View>
              <View style={[
                styles.versionTag,
                otaUpdate.status.isUpdatePending ? styles.versionTagNew : styles.versionTagLatest
              ]}>
                <ThemedText 
                  variant="tiny" 
                  style={{ color: otaUpdate.status.isUpdatePending ? '#1E40AF' : '#065F46' }}
                >
                  {otaUpdate.status.isUpdatePending ? '待重启' : '已是最新'}
                </ThemedText>
              </View>
            </View>
            
            {/* OTA 更新状态 */}
            {(otaUpdate.status.isChecking || otaUpdate.status.isDownloading) && (
              <View style={styles.wifiStatus}>
                <ActivityIndicator size="small" color={theme.primary} />
                <ThemedText variant="small" color={theme.textSecondary}>
                  {otaUpdate.status.isChecking ? '检查更新中...' : '下载更新中...'}
                </ThemedText>
              </View>
            )}
            
            {/* 服务端版本检查 */}
            {versionChecking && !otaUpdate.status.isChecking && (
              <View style={styles.wifiStatus}>
                <ActivityIndicator size="small" color={theme.textMuted} />
                <ThemedText variant="small" color={theme.textMuted}>检查版本信息...</ThemedText>
              </View>
            )}
            
            {/* 有待重启的更新 */}
            {otaUpdate.status.isUpdatePending && (
              <>
                <View style={[styles.releaseNotes, { backgroundColor: '#DBEAFE' }]}>
                  <ThemedText variant="labelSmall" color="#1E40AF" style={styles.releaseNotesTitle}>
                    更新已下载
                  </ThemedText>
                  <ThemedText variant="small" color="#1E40AF">
                    新版本已下载完成，重启 App 即可生效
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  style={styles.updateButton}
                  onPress={handleOTAUpdate}
                >
                  <ThemedText variant="bodyMedium" style={styles.updateButtonText}>
                    立即重启
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
            
            {/* 服务端提示有新版本 */}
            {versionInfo?.needsUpdate && !otaUpdate.status.isUpdatePending && (
              <>
                <ThemedText variant="small" color={theme.textSecondary}>
                  最新版本：v{versionInfo.latestVersion} ({versionInfo.releaseDate})
                </ThemedText>
                
                {versionInfo.releaseNotes && versionInfo.releaseNotes.length > 0 && (
                  <View style={styles.releaseNotes}>
                    <ThemedText variant="labelSmall" color={theme.textMuted} style={styles.releaseNotesTitle}>
                      更新内容
                    </ThemedText>
                    {versionInfo.releaseNotes.map((note, index) => (
                      <View key={index} style={styles.releaseNoteItem}>
                        <View style={styles.releaseNoteDot} />
                        <ThemedText variant="small" color={theme.textSecondary}>{note}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.updateButton}
                  onPress={handleOTAUpdate}
                >
                  {otaUpdate.status.isDownloading ? (
                    <ActivityIndicator color={theme.buttonPrimaryText} />
                  ) : (
                    <ThemedText variant="bodyMedium" style={styles.updateButtonText}>
                      立即更新
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </>
            )}
            
            {/* 已是最新版本 */}
            {!versionInfo?.needsUpdate && versionInfo && !otaUpdate.status.isUpdatePending && (
              <ThemedText variant="small" color={theme.textMuted}>
                您使用的是最新版本
              </ThemedText>
            )}
            
            {/* 错误提示 */}
            {otaUpdate.status.error && (
              <ThemedText variant="small" color={theme.error}>
                {otaUpdate.status.error}
              </ThemedText>
            )}
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
