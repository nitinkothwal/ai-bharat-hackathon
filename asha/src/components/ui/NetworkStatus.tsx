import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { Wifi, WifiOff, Signal, SignalLow } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { NetworkUtils } from '../../utils/network';

interface NetworkStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  style?: any;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showDetails = false,
  compact = false,
  style,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isOnline, lastSyncTime } = useAppSelector(state => state.sync);
  const [networkInfo, setNetworkInfo] = useState<{
    isConnected: boolean;
    type: string;
    strength?: 'excellent' | 'good' | 'fair' | 'poor';
  }>({
    isConnected: false,
    type: 'unknown',
  });

  useEffect(() => {
    const checkNetworkInfo = async () => {
      try {
        const info = await NetworkUtils.getNetworkInfo();
        setNetworkInfo({
          isConnected: info.isConnected,
          type: info.type || 'unknown',
          strength: getSignalStrength(), // Mock implementation
        });
      } catch (error) {
        console.error('Error checking network info:', error);
      }
    };

    checkNetworkInfo();
    
    // Check network status every 30 seconds
    const interval = setInterval(checkNetworkInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getSignalStrength = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    // Mock signal strength - in a real app, you'd get this from the network API
    const strengths: ('excellent' | 'good' | 'fair' | 'poor')[] = ['excellent', 'good', 'fair', 'poor'];
    return strengths[Math.floor(Math.random() * strengths.length)];
  };

  const getStatusColor = () => {
    if (!networkInfo.isConnected) return theme.colors.error;
    if (networkInfo.strength === 'poor') return theme.colors.onSurfaceVariant;
    return theme.colors.primary;
  };

  const getStatusIcon = () => {
    if (!networkInfo.isConnected) {
      return <WifiOff size={16} color={getStatusColor()} />;
    }
    
    if (networkInfo.strength === 'poor' || networkInfo.strength === 'fair') {
      return <SignalLow size={16} color={getStatusColor()} />;
    }
    
    return networkInfo.type === 'wifi' ? 
      <Wifi size={16} color={getStatusColor()} /> : 
      <Signal size={16} color={getStatusColor()} />;
  };

  const getStatusText = () => {
    if (!networkInfo.isConnected) {
      return t('sync.offline');
    }
    
    return t('sync.online');
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) {
      return t('sync.never_synced');
    }
    
    const syncDate = new Date(lastSyncTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) {
      return t('sync.just_now');
    } else if (diffMinutes < 60) {
      return t('sync.minutes_ago', { count: diffMinutes });
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return t('sync.hours_ago', { count: diffHours });
    }
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Chip
          icon={() => getStatusIcon()}
          style={[
            styles.compactChip,
            { backgroundColor: getStatusColor() + '20' }
          ]}
          textStyle={{ color: getStatusColor(), fontSize: 12 }}
        >
          {getStatusText()}
        </Chip>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusRow}>
        {getStatusIcon()}
        <Text 
          variant="bodyMedium" 
          style={[styles.statusText, { color: getStatusColor() }]}
        >
          {getStatusText()}
        </Text>
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text variant="bodySmall" style={styles.detailText}>
            {networkInfo.isConnected ? 
              t('sync.connected_description') : 
              t('sync.offline_description')
            }
          </Text>
          
          {networkInfo.isConnected && (
            <Text variant="bodySmall" style={styles.detailText}>
              {t('sync.last_sync')}: {getLastSyncText()}
            </Text>
          )}
          
          {networkInfo.type && networkInfo.type !== 'unknown' && (
            <Text variant="bodySmall" style={styles.detailText}>
              Connection: {networkInfo.type.toUpperCase()}
              {networkInfo.strength && ` (${networkInfo.strength})`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  compactContainer: {
    alignItems: 'center',
  },
  compactChip: {
    height: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 4,
  },
  detailText: {
    opacity: 0.7,
    marginBottom: 2,
  },
});