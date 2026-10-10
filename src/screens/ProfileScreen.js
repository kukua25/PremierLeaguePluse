import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alert';
import { TEAM_BADGES } from '../constants/teamBadges';

const PL_TEAMS = [
  'Arsenal',
  'Aston Villa',
  'Bournemouth',
  'Brentford',
  'Brighton & Hove Albion',
  'Chelsea',
  'Crystal Palace',
  'Everton',
  'Fulham',
  'Ipswich Town',
  'Leicester City',
  'Liverpool',
  'Manchester City',
  'Manchester United',
  'Newcastle United',
  'Nottingham Forest',
  'Southampton',
  'Tottenham Hotspur',
  'West Ham United',
  'Wolverhampton Wanderers',
];

export default function ProfileScreen() {
  const { user, favoriteTeam, favoriteTeamLoading, updateFavoriteTeam } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSelectTeam = async (team) => {
    if (team === favoriteTeam) return;
    setSaving(true);
    const result = await updateFavoriteTeam(team);
    setSaving(false);
    if (!result.success) {
      showAlert('Error', result.error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.accountCard}>
        <Text style={styles.accountLabel}>Signed in as</Text>
        <Text style={styles.accountEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Favorite Premier League Team</Text>

        {favoriteTeam && (
          <View style={styles.selectedBanner}>
            <Text style={styles.selectedBannerText}>{favoriteTeam}</Text>
            <Text style={styles.selectedBannerSub}>Your current pick</Text>
          </View>
        )}

        {favoriteTeamLoading ? (
          <ActivityIndicator color="#38003c" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.teamGrid}>
            {PL_TEAMS.map((team) => {
              const isSelected = team === favoriteTeam;
              const badgeUrl = TEAM_BADGES[team];
              return (
                <TouchableOpacity
                  key={team}
                  style={[styles.teamChip, isSelected && styles.teamChipSelected]}
                  onPress={() => handleSelectTeam(team)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  {badgeUrl && (
                    <Image source={{ uri: badgeUrl }} style={styles.teamBadge} resizeMode="contain" />
                  )}
                  <Text style={[styles.teamChipText, isSelected && styles.teamChipTextSelected]}>
                    {team}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}> ✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {saving && (
          <View style={styles.savingRow}>
            <ActivityIndicator color="#38003c" size="small" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 12,
    marginBottom: 28,
  },
  accountLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  selectedBanner: {
    backgroundColor: '#38003c',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedBannerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedBannerSub: {
    color: '#e8d5ea',
    fontSize: 12,
    marginTop: 4,
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  teamBadge: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  teamChipSelected: {
    backgroundColor: '#38003c',
    borderColor: '#38003c',
  },
  teamChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  teamChipTextSelected: {
    color: '#fff',
  },
  checkmark: {
    color: '#00d4aa',
    fontWeight: 'bold',
    fontSize: 14,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  savingText: {
    color: '#38003c',
    fontSize: 14,
  },
});
