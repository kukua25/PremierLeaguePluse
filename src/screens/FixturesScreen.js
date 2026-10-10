import React, { useState, useEffect } from 'react';
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
import { TEAM_BADGES } from '../constants/teamBadges';
import { TEAM_IDS } from '../constants/teamIds';

const SPORTSDB_BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

const fetchTeamFixtures = async (teamId) => {
  const [nextRes, lastRes] = await Promise.all([
    fetch(`${SPORTSDB_BASE_URL}/eventsnext.php?id=${teamId}`),
    fetch(`${SPORTSDB_BASE_URL}/eventslast.php?id=${teamId}`),
  ]);

  if (!nextRes.ok || !lastRes.ok) {
    throw new Error('Could not load fixtures. Please try again.');
  }

  const nextData = await nextRes.json();
  const lastData = await lastRes.json();

  return {
    next: nextData.events?.[0] ?? null,
    last: lastData.results?.[0] ?? null,
  };
};

const formatEventDate = (dateString) => {
  if (!dateString) return '';
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

function TeamRow({ name, badge, score, align }) {
  return (
    <View style={[styles.teamRow, align === 'right' && styles.teamRowReverse]}>
      {badge ? (
        <Image source={{ uri: badge }} style={styles.teamRowBadge} resizeMode="contain" />
      ) : (
        <View style={styles.teamRowBadgePlaceholder} />
      )}
      <Text style={styles.teamRowName} numberOfLines={2}>{name}</Text>
      {score != null && <Text style={styles.teamRowScore}>{score}</Text>}
    </View>
  );
}

function NextMatchCard({ event }) {
  return (
    <View style={styles.matchCard}>
      <Text style={styles.matchMeta}>
        {formatEventDate(event.dateEvent)}{event.strTime ? ` • ${event.strTime.slice(0, 5)}` : ''}
      </Text>
      <View style={styles.matchup}>
        <TeamRow name={event.strHomeTeam} badge={event.strHomeTeamBadge} />
        <Text style={styles.vsText}>vs</Text>
        <TeamRow name={event.strAwayTeam} badge={event.strAwayTeamBadge} align="right" />
      </View>
      {!!event.strVenue && <Text style={styles.matchVenue}>{event.strVenue}</Text>}
      {!!event.strLeague && <Text style={styles.matchLeague}>{event.strLeague}</Text>}
    </View>
  );
}

function LastResultCard({ event }) {
  return (
    <View style={styles.matchCard}>
      <Text style={styles.matchMeta}>{formatEventDate(event.dateEvent)}</Text>
      <View style={styles.matchup}>
        <TeamRow name={event.strHomeTeam} badge={event.strHomeTeamBadge} score={event.intHomeScore} />
        <Text style={styles.vsText}>–</Text>
        <TeamRow name={event.strAwayTeam} badge={event.strAwayTeamBadge} score={event.intAwayScore} align="right" />
      </View>
      {!!event.strLeague && <Text style={styles.matchLeague}>{event.strLeague}</Text>}
    </View>
  );
}

export default function FixturesScreen({ navigation }) {
  const { favoriteTeam } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [lastMatch, setLastMatch] = useState(null);

  useEffect(() => {
    if (!favoriteTeam) {
      setLoading(false);
      return;
    }
    loadFixtures();
  }, [favoriteTeam]);

  const loadFixtures = async () => {
    const teamId = TEAM_IDS[favoriteTeam];
    if (!teamId) {
      setLoading(false);
      setError("Fixtures aren't available for this team yet.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { next, last } = await fetchTeamFixtures(teamId);
      setNextMatch(next);
      setLastMatch(last);
    } catch (err) {
      console.error('Error fetching fixtures:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!favoriteTeam) {
    return (
      <View style={styles.promptContainer}>
        <Text style={styles.promptEmoji}>⚽</Text>
        <Text style={styles.promptTitle}>Pick a Favorite Team</Text>
        <Text style={styles.promptSubtitle}>
          Choose a team in Profile to see their next match and latest result.
        </Text>
        <TouchableOpacity style={styles.promptButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.promptButtonText}>Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.teamHeader}>
        {TEAM_BADGES[favoriteTeam] && (
          <Image source={{ uri: TEAM_BADGES[favoriteTeam] }} style={styles.teamHeaderBadge} resizeMode="contain" />
        )}
        <Text style={styles.teamHeaderName}>{favoriteTeam}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#38003c" style={styles.loadingSpinner} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFixtures}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Next Match</Text>
            {nextMatch ? (
              <NextMatchCard event={nextMatch} />
            ) : (
              <Text style={styles.emptyNote}>No upcoming fixture scheduled.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Last Result</Text>
            {lastMatch ? (
              <LastResultCard event={lastMatch} />
            ) : (
              <Text style={styles.emptyNote}>No recent result available.</Text>
            )}
          </View>
        </>
      )}
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
  teamHeader: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  teamHeaderBadge: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  teamHeaderName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    marginBottom: 10,
    marginLeft: 4,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eee',
  },
  matchMeta: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 14,
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamRow: {
    flex: 1,
    alignItems: 'center',
  },
  teamRowReverse: {
    alignItems: 'center',
  },
  teamRowBadge: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  teamRowBadgePlaceholder: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  teamRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  teamRowScore: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38003c',
    marginTop: 4,
  },
  vsText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '600',
    marginHorizontal: 12,
  },
  matchVenue: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  matchLeague: {
    fontSize: 12,
    color: '#38003c',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyNote: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  loadingSpinner: {
    marginTop: 40,
  },
  errorBox: {
    alignItems: 'center',
    paddingTop: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#38003c',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
  },
  promptEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#38003c',
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  promptButton: {
    backgroundColor: '#38003c',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
  },
  promptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
