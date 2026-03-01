import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { Text, Searchbar, useTheme, List, Avatar, Divider, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { patientService } from '@/src/services/api';
import { Patient } from '@/src/types';
import { User, Search, Filter } from 'lucide-react-native';

export default function PatientListScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    patientService.getAll().then(setPatients);
  }, []);

  const filteredPatients = (patients || []).filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search by name..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          icon={() => <Search size={20} color={theme.colors.onSurfaceVariant} />}
        />
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={`${item.age} years • ${item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}`}
            left={(props) => (
              <Avatar.Text
                size={40}
                label={item.name.substring(0, 2).toUpperCase()}
                style={[props.style, { backgroundColor: theme.colors.secondaryContainer }]}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push(`/referral/new?patientId=${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="white"
        onPress={() => router.push('/patient/new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 16,
    backgroundColor: '#F8FAF9',
  },
  searchBar: {
    elevation: 0,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

