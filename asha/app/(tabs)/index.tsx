import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, View, ScrollView } from 'react-native';
import { Text, FAB, Searchbar, useTheme, Avatar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import GlassCard from '@/components/glass/GlassCard';
import { patientService } from '@/src/services/api';
import { Patient } from '@/src/types';
import { Users, AlertCircle, CheckCircle2, Search } from 'lucide-react-native';

export default function HomeDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const fetchPatients = async () => {
    try {
      const data = await patientService.getAll();
      setPatients(data);
    } catch (error) {
      console.error('Failed to fetch patients', error);
      // For demo purposes, if API fails, we could use mock data but let's stick to real for now
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPatients();
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
          <Text variant="headlineSmall" style={styles.headerTitle}>Welcome Back</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>ASHA Region: North-East 12</Text>
        </View>

        <View style={styles.statsContainer}>
          <GlassCard style={styles.statCard} intensity={0.8}>
            <View style={styles.statIconHeader}>
              <Users size={20} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ marginLeft: 8 }}>Patients</Text>
            </View>
            <Text variant="displaySmall" style={styles.statValue}>{patients.length}</Text>
          </GlassCard>

          <GlassCard style={StyleSheet.flatten([styles.statCard, { backgroundColor: 'rgba(255, 235, 238, 0.8)' }])} intensity={0.9}>

            <View style={styles.statIconHeader}>
              <AlertCircle size={20} color={theme.colors.error} />
              <Text variant="titleMedium" style={{ marginLeft: 8 }}>High Risk</Text>
            </View>
            <Text variant="displaySmall" style={[styles.statValue, { color: theme.colors.error }]}>3</Text>
          </GlassCard>
        </View>

        <Searchbar
          placeholder="Search patients..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon={() => <Search size={20} color={theme.colors.onSurfaceVariant} />}
        />

        <View style={styles.sectionHeader}>
          <Text variant="titleLarge">Recent Patients</Text>
          <IconButton
            icon="chevron-right"
            onPress={() => router.push('/(tabs)/two')}
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
        label="Add Patient"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="white"
        onPress={() => router.push('/patient/type-select')}
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

