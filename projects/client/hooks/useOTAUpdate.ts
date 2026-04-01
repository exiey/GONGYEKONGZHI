import { useState, useCallback, useEffect } from 'react';
import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

export interface UpdateStatus {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useOTAUpdate() {
  const [status, setStatus] = useState<UpdateStatus>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
    error: null,
    lastChecked: null,
  });

  // 检查更新
  const checkForUpdate = useCallback(async () => {
    if (__DEV__ || Platform.OS === 'web') {
      // 开发模式或 Web 端不支持 OTA 更新
      return null;
    }

    setStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const update = await Updates.checkForUpdateAsync();
      
      setStatus(prev => ({
        ...prev,
        isChecking: false,
        isUpdateAvailable: update.isAvailable,
        lastChecked: new Date(),
      }));

      return update;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检查更新失败';
      setStatus(prev => ({
        ...prev,
        isChecking: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  // 下载更新
  const downloadUpdate = useCallback(async () => {
    if (__DEV__ || Platform.OS === 'web') {
      Alert.alert('提示', '开发模式不支持 OTA 更新');
      return null;
    }

    setStatus(prev => ({ ...prev, isDownloading: true, error: null }));

    try {
      const result = await Updates.fetchUpdateAsync();
      
      setStatus(prev => ({
        ...prev,
        isDownloading: false,
        isUpdatePending: result.isNew,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '下载更新失败';
      setStatus(prev => ({
        ...prev,
        isDownloading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  // 应用更新（重启 App）
  const applyUpdate = useCallback(async () => {
    if (__DEV__ || Platform.OS === 'web') {
      Alert.alert('提示', '开发模式不支持 OTA 更新');
      return;
    }

    Alert.alert(
      '更新完成',
      '新版本已下载，是否立即重启应用？',
      [
        { text: '稍后重启', style: 'cancel' },
        { 
          text: '立即重启', 
          onPress: async () => {
            await Updates.reloadAsync();
          }
        }
      ]
    );
  }, []);

  // 一键更新（检查 + 下载 + 提示重启）
  const performUpdate = useCallback(async () => {
    if (__DEV__ || Platform.OS === 'web') {
      Alert.alert('提示', '开发模式和 Web 端不支持 OTA 更新。\n\n实际发布后，用户打开 App 会自动检查并下载更新。');
      return false;
    }

    // 1. 检查更新
    const checkResult = await checkForUpdate();
    if (!checkResult?.isAvailable) {
      Alert.alert('已是最新', '当前已是最新版本');
      return false;
    }

    // 2. 下载更新
    Alert.alert('发现新版本', '正在下载更新...');
    const downloadResult = await downloadUpdate();
    if (!downloadResult?.isNew) {
      Alert.alert('更新失败', '下载更新失败，请稍后重试');
      return false;
    }

    // 3. 提示重启
    applyUpdate();
    return true;
  }, [checkForUpdate, downloadUpdate, applyUpdate]);

  // 获取当前版本信息
  const getCurrentVersion = useCallback(() => {
    return {
      version: Updates.runtimeVersion || 'unknown',
      updateId: Updates.updateId,
      channel: Updates.channel,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    };
  }, []);

  return {
    status,
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
    performUpdate,
    getCurrentVersion,
    // 是否支持 OTA（非开发模式且非 Web）
    isOTASupported: !__DEV__ && Platform.OS !== 'web',
  };
}
