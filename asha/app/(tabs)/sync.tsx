import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ProgressBar, useTheme, Surface, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../../src/store/hooks';
import { syncData, checkSyncStatus } from '../../src/store/slices/syncSlice';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle, AlertTriangle } from 'lucide-react-native';

export default function SyncScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  const { 
    isOnline, 
    isSyncing, 
    lastSyncTime, 
    pendingItems, 
    syncProgress,
    error 
  } = useAppSelector(state => state.sync);

  const [timeOffline, setTimeOffline] = useState(0);

  useEffect(() => {
    dispatch(checkSyncStatus());
    
    // Calculate time offline
    if (lastSyncTime) {
      const timeDiff = Date.now() - new Date(lastSyncTime).getTime();
      setTimeOffline(Math.floor(timeDiff / (1000 * 60 * 60))); // hours
    }
  }, [dispatch, lastSyncTime]);

  const handleManualSync = () => {
    dispatch(syncData());
  };

  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return t('sync.never_synced');
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('sync.just_now');
    if (diffInMinutes < 60) return t('sync.minutes_ago', { count: diffInMinutes });
    if (diffInMinutes < 1440) return t('sync.hours_ago', { count: Math.floor(diffInMinutes / 60) });
    return date.toLocaleDateString();
  };

  const getSyncStatusColor = () => {
    if (error) return theme.colors.error;
    if (isSyncing) return theme.colors.primary;
    if (timeOffline > 48) return theme.colors.error;
    if (timeOffline > 24) return theme.colors.tertiary;
    return theme.colors.primary;
  };

  const getSyncStatusIcon = () => {
    if (error) return <AlertTriangle size={24} color={theme.colors.error} />;
    if (isSyncing) return <RefreshCw size={24} color={theme.colors.primary} />;
    if (timeOffline > 48) return <WifiOff size={24} color={theme.colors.error} />;
    return <CheckCircle size={24} color={theme.colors.primary} />;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Connection Status */}
      <Card style={styles.statusCard} mode="outlined">
        <Card.Content>
          <View style={styles.statusHeader}>
            {isOnline ? (
              <Wifi size={24} color={theme.colors.primary} />
            ) : (
              <WifiOff size={24} color={theme.colors.error} />
            )}
            <Text variant="titleMedium" style={styles.statusTitle}>
              {isOnline ? t('sync.online') : t('sync.offline')}
            </Text>
          </View>
          
          <Text variant="bodyMedium" style={styles.statusDescription}>
            {isOnline 
              ? t('sync.connected_description') 
              : t('sync.offline_description')
            }
          </Text>
        </Card.Content>
      </Card>

      {/* Sync Status */}
      <Card style={styles.syncCard} mode="outlined">
        <Card.Content>
          <View style={styles.syncHeader}>
            {getSyncStatusIcon()}
            <View style={styles.syncInfo}>
              <Text variant="titleMedium" style={styles.syncTitle}>
                {t('sync.title')}
              </Text>
              <Text variant="bodySmall" style={styles.lastSyncText}>
                {t('sync.last_sync')}: {formatLastSyncTime(lastSyncTime)}
              </Text>
            </View>
          </View>

          {isSyncing && (
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={syncProgress / 100} 
                style={styles.progressBar}
                color={theme.colors.primary}
              />
              <Text variant="bodySmall" style={styles.progressText}>
                {t('sync.syncing')} {Math.round(syncProgress)}%
              </Text>
            </View>
          )}

          {error && (
            <Surface style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
              <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                {error}
              </Text>
            </Surface>
          )}

          {timeOffline > 48 && (
            <Surface style={[styles.warningContainer, { backgroundColor: theme.colors.errorContainer }]}>
              <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                {t('sync.offline_warning')}
              </Text>
            </Surface>
          )}
        </Card.Content>
      </Card>

      {/* Pending Items */}
      <Card style={styles.pendingCard} mode="outlined">
        <Card.Content>
          <View style={styles.pendingHeader}>
            <Clock size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.pendingTitle}>
              {t('sync.pending_items', { count: pendingItems.length })}
            </Text>
          </View>

          {pendingItems.length > 0 ? (
            <View style={styles.pendingList}>
              {pendingItems.slice(0, 5).map((item, index) => (
                <View key={index}>
                  <View style={styles.pendingItem}>
                    <Text variant="bodyMedium" style={styles.pendingItemType}>
                      {t(`sync.item_type.${item.type}`)}
                    </Text>
                    <Text variant="bodySmall" style={styles.pendingItemTime}>
                      {new Date(item.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  {index < Math.min(pendingItems.length - 1, 4) && <Divider />}
                </View>
              ))}
              
              {pendingItems.length > 5 && (
                <Text variant="bodySmall" style={styles.moreItemsText}>
                  {t('sync.more_items', { count: pendingItems.length - 5 })}
                </Text>
              )}
            </View>
          ) : (
            <Text variant="bodyMedium" style={styles.noPendingText}>
              {t('sync.no_pending_items')}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Manual Sync Button */}
      <Button
        mode="contained"
        onPress={handleManualSync}
        disabled={!isOnline || isSyncing}
        loading={isSyncing}
        style={styles.syncButton}
        contentStyle={styles.syncButtonContent}
        icon={() => <RefreshCw size={20} color="white" />}
      >
        {isSyncing ? t('sync.syncing') : t('sync.sync_now')}
      </Button>

      {/* Sync Settings */}
      <Card style={styles.settingsCard} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.settingsTitle}>
            {t('sync.settings')}
          </Text>
          
          <View style={styles.settingItem}>
            <Text variant="bodyMedium">{t('sync.auto_sync')}</Text>
            <Text variant="bodySmall" style={styles.settingValue}>
              {t('sync.every_15_minutes')}
            </Text>
          </View>
          
          <Divider style={styles.settingDivider} />
          
          <View style={styles.settingItem}>
            <Text variant="bodyMedium">{t('sync.sync_on_wifi_only')}</Text>
            <Text variant="bodySmall" style={styles.settingValue}>
              {t('common.disabled')}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  contentContainer: {
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    marginLeft: 12,
    fontWeight: '600',
  },
  statusDescription: {
    color: '#666',
    marginLeft: 36,
  },
  syncCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncInfo: {
    marginLeft: 12,
    flex: 1,
  },
  syncTitle: {
    fontWeight: '600',
  },
  lastSyncText: {
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  pendingCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  pendingList: {
    marginTop: 8,
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pendingItemType: {
    flex: 1,
  },
  pendingItemTime: {
    color: '#666',
  },
  moreItemsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  noPendingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  syncButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  syncButtonContent: {
    paddingVertical: 8,
  },
  settingsCard: {
    backgroundColor: 'white',
  },
  settingsTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingValue: {
    color: '#666',
  },
  settingDivider: {
    marginVertical: 8,
  },
});