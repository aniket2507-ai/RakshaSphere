import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const CARDS = [
  {
    id: 'map',
    icon: '🗺',
    title: 'Safety Map',
    subtitle: 'Live risk zones, safe routing & SOS',
    color: '#1565C0',
    accent: '#1976D2',
    stats: [{ label: 'Zones', value: '15' }, { label: 'Live', value: '●' }, { label: 'SOS', value: '24/7' }],
  },
  {
    id: 'infra',
    icon: '🏗',
    title: 'Infrastructure Monitor',
    subtitle: 'AI-powered damage & hazard detection',
    color: '#2E7D32',
    accent: '#388E3C',
    stats: [{ label: 'AI Model', value: 'Active' }, { label: 'Upload', value: 'Image' }, { label: 'Report', value: 'Auto' }],
  },
];

export default function DashboardScreen({ onNavigate }) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🛡 RakshaSphere</Text>
          <Text style={styles.headerSub}>Urban Safety Dashboard</Text>
        </View>
        <View style={styles.statusDot}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>Live</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Welcome back</Text>
          <Text style={styles.bannerSub}>Select a module to get started</Text>
        </View>

        {CARDS.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.card, { borderLeftColor: card.accent }]}
            onPress={() => onNavigate(card.id)}
            activeOpacity={0.88}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: card.color + '18' }]}>
              <Text style={styles.cardIcon}>{card.icon}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSub}>{card.subtitle}</Text>
              <View style={styles.cardStats}>
                {card.stats.map((s) => (
                  <View key={s.label} style={styles.statChip}>
                    <Text style={[styles.statValue, s.value === '●' && { color: '#4CAF50' }]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={[styles.cardArrow, { color: card.accent }]}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.statsRow}>
          {[
            { icon: '🟢', label: 'Safe Zones', value: '8' },
            { icon: '🟡', label: 'Moderate', value: '5' },
            { icon: '🔴', label: 'High Risk', value: '2' },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statBoxIcon}>{s.icon}</Text>
              <Text style={styles.statBoxValue}>{s.value}</Text>
              <Text style={styles.statBoxLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FA' },
  header: {
    backgroundColor: '#0d1b2a', paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: '#90caf9', marginTop: 2 },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  statusText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' },
  body: { padding: 16, gap: 14 },
  banner: { backgroundColor: '#1565C0', borderRadius: 14, padding: 18, marginBottom: 4 },
  bannerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  bannerSub: { fontSize: 13, color: '#90caf9', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, borderLeftWidth: 4,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardIcon: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 3 },
  cardSub: { fontSize: 12, color: '#666', marginBottom: 10 },
  cardStats: { flexDirection: 'row', gap: 8 },
  statChip: { backgroundColor: '#F0F4FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  statValue: { fontSize: 12, fontWeight: 'bold', color: '#1565C0' },
  statLabel: { fontSize: 9, color: '#888', marginTop: 1 },
  cardArrow: { fontSize: 28, fontWeight: '300' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statBoxIcon: { fontSize: 20, marginBottom: 4 },
  statBoxValue: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  statBoxLabel: { fontSize: 11, color: '#888', marginTop: 2 },
});
