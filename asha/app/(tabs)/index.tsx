import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, View, ScrollView } from 'react-native';
import { Text, FAB, Searchbar, useTheme, Avatar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import GlassCard from '@/components/glass/GlassCard';
import { useAppSelector, useAppDispatch } from '../../src/store/hooks';
import { fetchPatients } from '../../src/store/slices/patientsSlice';
import { Patient } from '@/src/types';
import { Users, AlertCircle, CheckCircle2, Search } from 'lucide-react-native';

export default function PatientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  
  const { patients, isLoading } = useAppSelector(state => state.patients);
  const { user } = useAppSelector(state => state.auth);

  const fetchPatientsData = async () => {
    dispatch(fetchPatients());
  };

  useEffect(() => {
    fetchPatientsData();
  }, [dispatch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPatientsData();
    setRefreshing(false);
  }, []);

  const filteredPatients = (patients || []).filter(p =>
    p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {t('navigation.patients')}
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {user?.name || 'ASHA Worker'} • {user?.village_code || 'VIL001'}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <GlassCard style={styles.statCard} intensity={0.8}>
            <View style={styles.statIconHeader}>
              <Users size={20} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                {t('navigation.patients')}
              </Text>
            </View>
            <Text variant="displaySmall" style={styles.statValue}>{patients.length}</Text>
          </GlassCard>

          <GlassCard style={StyleSheet.flatten([styles.statCard, { backgroundColor: 'rgba(255, 235, 238, 0.8)' }])} intensity={0.9}>

            <View style={styles.statIconHeader}>
              <AlertCircle size={20} color={theme.colors.error} />
              <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                {t('referral.high_risk')}
              </Text>
            </View>
            <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.error }]}>3</Text>
          </GlassCard>
        </View>

        <Searchbar
          placeholder={t('patient.search')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon={() => <Search size={20} color={theme.colors.onSurfaceVariant} />}
        />

        <View style={styles.sectionHeader}>
          <Text variant="titleLarge">{t('patient.recent_patients')}</Text>
          <IconButton
            icon="chevron-right"
            onPress={() => router.push('/patient/list')}
          />
        </View>

        {filteredPatients.map((item) => (
          <GlassCard key={item.id} style={styles.patientCard} intensity={0.4}>
            <View style={styles.patientInfo}>
              <Avatar.Text
                size={40}
                label={(item.name || '??').substring(0, 2).toUpperCase()}
                style={{ backgroundColor: theme.colors.primary }}
              />
              <View style={styles.patientMeta}>
                <Text variant="titleMedium">{item.name || 'Unknown'}</Text>
                <Text variant="bodySmall">{item.age} years • {item.gender}</Text>
              </View>
              <IconButton
                icon="stethoscope"
                mode="contained-tonal"
                onPress={() => router.push(`/referral/new?patientId=${item.id}`)}
              />
            </View>
          </GlassCard>
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        label={t('patient.register')}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="white"
        onPress={() => router.push('/patient/register')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    marginTop: 40,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#006B5E',
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
  },
  statIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
  },
  searchBar: {
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientCard: {
    marginBottom: 12,
    padding: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientMeta: {
    marginLeft: 12,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

