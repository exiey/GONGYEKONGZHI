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
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.lg,
      gap: Spacing.sm,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusDotOnline: {
      backgroundColor: theme.success,
    },
    statusDotOffline: {
      backgroundColor: theme.error,
    },
    statusText: {
      fontSize: 12,
      color: theme.textMuted,
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
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: theme.textMuted,
    },
    cardIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardValue: {
      marginTop: Spacing.sm,
    },
    cardUnit: {
      marginTop: Spacing.xs,
    },
    sensorGrid: {
      gap: Spacing.lg,
    },
    sensorRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    sensorCard: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
    },
    sensorIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    sensorLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: theme.textMuted,
      marginBottom: Spacing.xs,
    },
    sensorValue: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.textPrimary,
      letterSpacing: -0.5,
    },
    sensorUnit: {
      fontSize: 14,
      fontWeight: '400',
      color: theme.textMuted,
    },
    alertBadge: {
      backgroundColor: theme.accent,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
    },
    alertBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    motionContainer: {
      marginTop: Spacing.lg,
    },
    motionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    motionItem: {
      alignItems: 'center',
    },
    motionLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: Spacing.xs,
    },
    motionValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.xl,
    },
    lastUpdate: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    lastUpdateText: {
      fontSize: 12,
      color: theme.textMuted,
    },
    // 设备信息卡片
    deviceInfoCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    deviceInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    deviceInfoLabel: {
      fontSize: 13,
      color: theme.textMuted,
    },
    deviceInfoValue: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    // 连接状态指示器
    connectionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundTertiary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.xl,
      gap: Spacing.sm,
    },
    connectionBannerSuccess: {
      backgroundColor: '#D1FAE5',
    },
    connectionBannerError: {
      backgroundColor: '#FEE2E2',
    },
    connectionBannerText: {
      fontSize: 13,
      fontWeight: '500',
    },
    // 阈值显示
    thresholdContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    thresholdBadge: {
      backgroundColor: theme.backgroundTertiary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
    },
    thresholdText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    // 状态标签
    statusTag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
      marginLeft: Spacing.sm,
    },
    statusNormal: {
      backgroundColor: '#D1FAE5',
    },
    statusAbnormal: {
      backgroundColor: '#FEE2E2',
    },
    statusTagText: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    // 欧拉角容器
    eulerContainer: {
      marginTop: Spacing.md,
    },
    eulerRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: Spacing.md,
    },
    eulerItem: {
      alignItems: 'center',
    },
    eulerLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 4,
    },
    eulerValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    eulerUnit: {
      fontSize: 12,
      color: theme.textMuted,
    },
    // 校准状态
    calibrationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
      marginTop: Spacing.md,
    },
    calibrationOk: {
      backgroundColor: '#D1FAE5',
    },
    calibrationNeeded: {
      backgroundColor: '#FEF3C7',
    },
  });
};
