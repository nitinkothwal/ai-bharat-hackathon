import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Card, Chip, useTheme, Searchbar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../src/store/hooks';
import { fetchReferrals } from '../../src/store/slices/referralsSlice';
import { Referral } from '../../src/types';
import { FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react-native';

export default function ReferralsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { referrals, isLoading } = useAppSelector(state => state.referrals);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    dispatch(fetchReferrals());
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReferrals(referrals);
    } else {
      const filtered = referrals.filter(referral =>
        referral.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        referral.referral_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReferrals(filtered);
    }
  }, [referrals, searchQuery]);

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.tertiary;
      case 'low':
        return theme.colors.primary;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock size={16} color={theme.colors.primary} />;
      case 'under_evaluation':
        return <AlertTriangle size={16} color={theme.colors.tertiary} />;
      case 'completed':
        return <CheckCircle size={16} color={theme.colors.primary} />;
      default:
        return <FileText size={16} color={theme.colors.outline} />;
    }
  };

  const formatReferralType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'pregnancy': t('referral.pregnancy'),
      'malnutrition': t('referral.malnutrition'),
      'tb_suspect': t('referral.tb_suspect'),
      'chronic_disease': t('referral.chronic_disease'),
    };
    return typeMap[type] || type;
  };

  const renderReferralItem = ({ item }: { item: Referral }) => (
    <Card style={styles.referralCard} mode="outlined">
      <Card.Content>
        <View style={styles.referralHeader}>
          <Text variant="titleMedium" style={styles.patientName}>
            {item.patient_name || 'Unknown Patient'}
          </Text>
          <View style={styles.statusContainer}>
            {getStatusIcon(item.status)}
          </View>
        </View>
        
        <Text variant="bodyMedium" style={styles.referralType}>
          {formatReferralType(item.referral_type)}
        </Text>
        
        <View style={styles.referralMeta}>
          <Chip
            mode="outlined"
            textStyle={{ fontSize: 12 }}
            style={[styles.riskChip, { borderColor: getRiskColor(item.risk_level) }]}
          >
            {item.risk_level ? t(`referral.${item.risk_level}_risk`) : t('referral.risk_score')}: {item.risk_score?.toFixed(2) || 'N/A'}
          </Chip>
          
          <Text variant="bodySmall" style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('patient.search')}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredReferrals}
        renderItem={renderReferralItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={64} color={theme.colors.outline} />
            <Text variant="bodyLarge" style={styles.emptyText}>
              {t('referral.no_referrals')}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/referral/new')}
        label={t('referral.new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  referralCard: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    flex: 1,
    fontWeight: '600',
  },
  statusContainer: {
    marginLeft: 8,
  },
  referralType: {
    color: '#666',
    marginBottom: 12,
  },
  referralMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskChip: {
    height: 28,
  },
  dateText: {
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});