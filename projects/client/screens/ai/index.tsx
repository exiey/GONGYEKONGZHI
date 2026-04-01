import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import RNSSE from 'react-native-sse';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
const DEFAULT_ESP32_IP = '192.168.4.1';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SensorData {
  sensor_data?: {
    temperature_humidity: { temperature: number; humidity: number; status: string };
    flame_sensor: { flame_detected: boolean; flame_intensity: number };
    smoke_sensor: { smoke_concentration: number; status: string };
    human_infrared: { human_detected: boolean; detection_distance: number };
    mpu6050: { euler_angle: { pitch: number; roll: number; yaw: number }; calibration_status: string };
  };
}

const QUICK_QUESTIONS = [
  '当前环境安全吗？',
  '分析传感器数据',
  '安全建议',
  '设备状态',
];

export default function AIScreen() {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sseRef = useRef<RNSSE | null>(null);
  const idCounterRef = useRef(0);

  const generateId = useCallback(() => {
    idCounterRef.current += 1;
    return `msg-${idCounterRef.current}`;
  }, []);

  const fetchSensorData = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`http://${DEFAULT_ESP32_IP}/data`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) setSensorData(await response.json());
    } catch {
      try {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/sensors/latest`);
        const result = await response.json();
        if (result.data) {
          setSensorData({
            sensor_data: {
              temperature_humidity: { temperature: result.data.temperature || 0, humidity: result.data.humidity || 0, status: 'normal' },
              flame_sensor: { flame_detected: result.data.flame_detected || false, flame_intensity: result.data.flame_intensity || 0 },
              smoke_sensor: { smoke_concentration: result.data.smoke_level || 0, status: result.data.smoke_alert ? 'abnormal' : 'normal' },
              human_infrared: { human_detected: result.data.pir_detected || false, detection_distance: 0 },
              mpu6050: {
                euler_angle: {
                  pitch: result.data.gyro_x || 0,
                  roll: result.data.gyro_y || 0,
                  yaw: result.data.gyro_z || 0,
                },
                calibration_status: 'calibrated',
              },
            },
          });
        }
      } catch (e) { console.error('Failed to fetch sensor data:', e); }
    }
  };

  useFocusEffect(useCallback(() => { fetchSensorData(); }, []));

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { id: generateId(), role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    const assistantId = generateId();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);

    try {
      if (sseRef.current) sseRef.current.close();
      sseRef.current = new RNSSE(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), sensorData, sessionId: 'mobile-session' }),
      });

      sseRef.current.addEventListener('message', (event) => {
        if (!event.data || event.data === '[DONE]') { setIsLoading(false); sseRef.current?.close(); return; }
        try {
          const data = JSON.parse(event.data);
          if (data.content) setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, content: msg.content + data.content } : msg));
        } catch (e) { console.error('Parse SSE error:', e); }
      });

      sseRef.current.addEventListener('error', () => {
        setIsLoading(false);
        setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, content: '抱歉，AI 服务暂时不可用。' } : msg));
      });
    } catch (error) {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, content: '发送消息失败，请检查网络。' } : msg));
    }
  };

  useEffect(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, [messages]);

  const getStatusInfo = () => {
    if (!sensorData?.sensor_data) return { status: 'offline', color: styles.statusDotOffline, text: '离线', badge: styles.statusOffline, textColor: theme.textMuted };
    const { smoke_sensor, flame_sensor } = sensorData.sensor_data;
    if (flame_sensor.flame_detected) return { status: 'danger', color: styles.statusDotDanger, text: '危险', badge: styles.statusDanger, textColor: '#991B1B' };
    if (smoke_sensor.status === 'abnormal') return { status: 'warning', color: styles.statusDotWarning, text: '警告', badge: styles.statusWarning, textColor: '#92400E' };
    return { status: 'normal', color: styles.statusDotNormal, text: '正常', badge: styles.statusNormal, textColor: '#065F46' };
  };

  const statusInfo = getStatusInfo();

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header - 精简版 */}
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h2" style={styles.headerTitle}>AI 分析</ThemedText>
          <ThemedText variant="small" color={theme.textMuted}>实时监测数据分析</ThemedText>
        </ThemedView>

        {/* 精简状态栏 - 一行显示 */}
        <View style={styles.compactStatus}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, statusInfo.color]} />
            <ThemedText variant="small" style={styles.statusLabel}>环境状态</ThemedText>
          </View>
          <View style={[styles.statusBadge, statusInfo.badge]}>
            <ThemedText variant="smallMedium" style={{ color: statusInfo.textColor }}>{statusInfo.text}</ThemedText>
          </View>
        </View>

        {/* 聊天区域 */}
        <ScrollView ref={scrollViewRef} style={styles.chatContainer} contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing.lg }}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="message-circle" size={28} color={theme.textMuted} />
              </View>
              <ThemedText variant="h4" style={styles.emptyTitle}>AI 监测助手</ThemedText>
              <ThemedText variant="small" color={theme.textMuted} style={{ textAlign: 'center', marginTop: 8 }}>
                问我关于传感器数据、安全状态或操作建议
              </ThemedText>
            </View>
          ) : (
            messages.map(msg => (
              <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
                <ThemedText variant="body" style={[styles.messageText, msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText]}>
                  {msg.content || (msg.role === 'assistant' && isLoading ? '思考中...' : '')}
                </ThemedText>
              </View>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, { opacity: 0.4 }]} />
              <View style={[styles.typingDot, { opacity: 0.7 }]} />
              <View style={styles.typingDot} />
            </View>
          )}
        </ScrollView>

        {/* 快捷问题 - 固定在输入框上方 */}
        <View style={styles.quickQuestionsScroll}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingRight: Spacing['2xl'] }}
          >
            {QUICK_QUESTIONS.map((q, i) => (
              <TouchableOpacity key={i} style={styles.quickQuestionButton} onPress={() => sendMessage(q)}>
                <ThemedText style={styles.quickQuestionText}>{q}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 输入区域 */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="输入问题..."
              placeholderTextColor={theme.textMuted}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <Feather name="send" size={18} color={theme.buttonPrimaryText} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
