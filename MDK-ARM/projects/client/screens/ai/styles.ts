import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  // 判断是否暗色模式
  const isDarkMode = theme.backgroundRoot === '#0A0A0A';
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    header: {
      paddingHorizontal: Spacing['2xl'],
      paddingTop: Spacing['3xl'],
      paddingBottom: Spacing.md,
    },
    headerTitle: {
      marginBottom: 2,
    },
    // 精简状态栏
    compactStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
    },
    statusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusDotNormal: {
      backgroundColor: '#10B981',
    },
    statusDotWarning: {
      backgroundColor: '#F59E0B',
    },
    statusDotDanger: {
      backgroundColor: '#EF4444',
    },
    statusDotOffline: {
      backgroundColor: '#9CA3AF',
    },
    statusLabel: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    statusNormal: {
      backgroundColor: '#D1FAE5',
    },
    statusWarning: {
      backgroundColor: '#FEF3C7',
    },
    statusDanger: {
      backgroundColor: '#FEE2E2',
    },
    statusOffline: {
      backgroundColor: theme.backgroundTertiary,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    // 聊天区域
    chatContainer: {
      flex: 1,
      paddingHorizontal: Spacing['2xl'],
    },
    messageBubble: {
      maxWidth: '85%',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.sm,
    },
    // 用户消息：暗色模式用深色背景，亮色模式用主色背景
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: isDarkMode ? '#2D2D2D' : theme.primary,
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: theme.border,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    // 用户消息文字：暗色模式用浅色，亮色模式用白色
    userMessageText: {
      color: isDarkMode ? '#FAFAFA' : '#FFFFFF',
    },
    assistantMessageText: {
      color: theme.textPrimary,
    },
    // 输入区域
    inputContainer: {
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.backgroundRoot,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Spacing.md,
    },
    textInput: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      fontSize: 15,
      color: theme.textPrimary,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDarkMode ? '#4F46E5' : theme.primary, // 暗色模式用蓝色
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: theme.textMuted,
    },
    // 快捷问题 - 横向滚动容器
    quickQuestionsScroll: {
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing['2xl'],
    },
    quickQuestionButton: {
      backgroundColor: theme.backgroundDefault,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: Spacing.sm,
    },
    quickQuestionText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    // 加载指示
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      padding: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      alignSelf: 'flex-start',
      marginBottom: Spacing.sm,
    },
    typingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.textMuted,
    },
    // 空状态
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      marginBottom: Spacing.xs,
    },
    // 时间戳
    timestamp: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: Spacing.xs,
    },
  });
};
