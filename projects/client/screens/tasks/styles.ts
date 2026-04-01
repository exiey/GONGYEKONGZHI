import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing['2xl'],
      paddingTop: Spacing['3xl'],
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing['3xl'],
    },
    headerTitle: {
      marginBottom: Spacing.xs,
    },
    headerSubtitle: {
      marginTop: Spacing.xs,
    },
    section: {
      marginBottom: Spacing['3xl'],
    },
    sectionTitle: {
      marginBottom: Spacing.xl,
    },
    card: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    taskButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.md,
    },
    taskButtonIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    taskButtonContent: {
      flex: 1,
    },
    taskButtonTitle: {
      marginBottom: Spacing.xs,
    },
    taskButtonDesc: {
      fontSize: 13,
      color: theme.textMuted,
    },
    taskButtonArrow: {
      marginLeft: Spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.xl,
    },
    historyItem: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.md,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    historyTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    historyIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
    },
    statusPending: {
      backgroundColor: '#FEF3C7',
    },
    statusExecuted: {
      backgroundColor: '#D1FAE5',
    },
    statusFailed: {
      backgroundColor: '#FEE2E2',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    statusTextPending: {
      color: '#92400E',
    },
    statusTextExecuted: {
      color: '#065F46',
    },
    statusTextFailed: {
      color: '#991B1B',
    },
    historyMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    historyMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing['4xl'],
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    emptyText: {
      color: theme.textMuted,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // 连接状态
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    connectionDotConnected: {
      backgroundColor: '#10B981',
    },
    connectionDotDisconnected: {
      backgroundColor: '#EF4444',
    },
    connectionText: {
      fontSize: 12,
      color: theme.textMuted,
    },
    // 指令回执
    cmdResponse: {
      marginTop: Spacing.md,
      padding: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
    },
    cmdResponseSuccess: {
      borderLeftWidth: 3,
      borderLeftColor: '#10B981',
    },
    cmdResponseFailed: {
      borderLeftWidth: 3,
      borderLeftColor: '#EF4444',
    },
    // 输入框样式（用于参数设置）
    inputContainer: {
      marginBottom: Spacing.lg,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    input: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      fontSize: 15,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    inputRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    inputHalf: {
      flex: 1,
    },
    // 模态框
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing['2xl'],
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      marginBottom: Spacing.xl,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing['2xl'],
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: theme.backgroundTertiary,
    },
    modalButtonConfirm: {
      backgroundColor: theme.primary,
    },
    modalButtonText: {
      fontWeight: '600',
    },
    // WiFi 配置卡片
    wifiCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    wifiCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    wifiCardIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    wifiInput: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      fontSize: 15,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.borderLight,
      marginBottom: Spacing.md,
    },
    wifiButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    wifiButtonText: {
      color: theme.buttonPrimaryText,
      fontWeight: '600',
    },
    wifiStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.md,
      gap: Spacing.sm,
    },
    // 版本更新卡片
    versionCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    versionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    versionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    versionIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.lg,
    },
    versionTag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
      backgroundColor: theme.backgroundTertiary,
    },
    versionTagLatest: {
      backgroundColor: '#D1FAE5',
    },
    versionTagNew: {
      backgroundColor: '#DBEAFE',
    },
    updateButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    updateButtonText: {
      color: theme.buttonPrimaryText,
      fontWeight: '600',
    },
    releaseNotes: {
      marginTop: Spacing.lg,
      padding: Spacing.lg,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
    },
    releaseNotesTitle: {
      marginBottom: Spacing.sm,
    },
    releaseNoteItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.xs,
    },
    releaseNoteDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.textMuted,
      marginRight: Spacing.sm,
      marginTop: 8,
    },
  });
};
