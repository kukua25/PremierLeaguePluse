import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Text,
  Image,
  TouchableOpacity
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import NewsCard from '../components/NewsCard';
import { GUARDIAN_API_KEY } from '../config/guardian';
import { useAuth } from '../context/AuthContext';
import { TEAM_BADGES } from '../constants/teamBadges';
import { showAlert } from '../utils/alert';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GUARDIAN_SEARCH_URL = 'https://content.guardianapis.com/search';

const oneMonthAgoISODate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 10);
};

// The API's `fields.thumbnail` is a small 500px-wide crop. Each article's
// `elements` list includes the same image at larger widths (up to 1000px) —
// pick the widest one available so cards aren't pixelated on larger screens.
const getHighestResImage = (item) => {
  const imageElement = item.elements?.find((el) => el.type === 'image');
  const assets = imageElement?.assets ?? [];
  if (assets.length === 0) return null;

  return assets.reduce((widest, asset) => {
    const width = parseInt(asset.typeData?.width, 10) || 0;
    const widestWidth = parseInt(widest?.typeData?.width, 10) || 0;
    return width > widestWidth ? asset : widest;
  }, assets[0]).file;
};

// Each PL club's Guardian keyword tag id — used to detect when one club's
// coverage (e.g. a big story like a financial-breach case) is dominating the
// general feed, so it can be rebalanced with other PL news.
const TEAM_TAG_IDS = {
  'Arsenal': 'football/arsenal',
  'Aston Villa': 'football/aston-villa',
  'Bournemouth': 'football/bournemouth',
  'Brentford': 'football/brentford',
  'Brighton & Hove Albion': 'football/brightonfootball',
  'Chelsea': 'football/chelsea',
  'Crystal Palace': 'football/crystalpalace',
  'Everton': 'football/everton',
  'Fulham': 'football/fulham',
  'Ipswich Town': 'football/ipswichtown',
  'Leicester City': 'football/leicestercity',
  'Liverpool': 'football/liverpool',
  'Manchester City': 'football/manchestercity',
  'Manchester United': 'football/manchester-united',
  'Newcastle United': 'football/newcastleunited',
  'Nottingham Forest': 'football/nottinghamforest',
  'Southampton': 'football/southampton',
  'Tottenham Hotspur': 'football/tottenham-hotspur',
  'West Ham United': 'football/westhamunited',
  'Wolverhampton Wanderers': 'football/wolves',
};

// Once one club's tag covers more than this share of the general feed,
// cap its share at this same value and backfill with other PL news.
const DOMINANT_STORY_THRESHOLD = 0.5;

const mapArticle = (item) => ({
  id: item.id,
  title: item.webTitle,
  description: item.fields?.trailText ?? '',
  published: item.webPublicationDate,
  links: [{ url: item.webUrl }],
  imageUrl: getHighestResImage(item) ?? item.fields?.thumbnail ?? null,
  tags: item.tags?.map((t) => t.id) ?? [],
});

const fetchGuardianArticles = async (extraParams = {}, pageSize = 50) => {
  const params = new URLSearchParams({
    tag: 'football/premierleague',
    'show-fields': 'trailText,thumbnail',
    'show-elements': 'image',
    'show-tags': 'keyword',
    'order-by': 'newest',
    'page-size': String(Math.min(pageSize, 50)),
    'api-key': GUARDIAN_API_KEY,
    ...extraParams,
  });

  const response = await fetch(`${GUARDIAN_SEARCH_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Guardian API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.response?.results ?? []).map(mapArticle);
};

// General PL feed: if one club's coverage has swamped the newest-first
// batch (e.g. a breaking financial-breach case), cap that club at ~half
// the feed and fill the rest with other PL news — fixtures, transfers,
// other clubs — rather than letting one storyline crowd out everything.
const fetchLeagueFeed = async () => {
  const batch = await fetchGuardianArticles({}, 50);

  const tagCounts = {};
  for (const article of batch) {
    const clubTag = article.tags.find((t) => Object.values(TEAM_TAG_IDS).includes(t));
    if (clubTag) tagCounts[clubTag] = (tagCounts[clubTag] || 0) + 1;
  }

  const [dominantTag, dominantCount] = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0] ?? [];
  const dominantShare = dominantCount ? dominantCount / batch.length : 0;

  if (!dominantTag || dominantShare <= DOMINANT_STORY_THRESHOLD) {
    return batch;
  }

  const dominantTeamName = Object.keys(TEAM_TAG_IDS).find((name) => TEAM_TAG_IDS[name] === dominantTag);
  const cap = Math.ceil(batch.length * DOMINANT_STORY_THRESHOLD);

  const dominantArticles = batch.filter((a) => a.tags.includes(dominantTag)).slice(0, cap);
  let restArticles = batch.filter((a) => !a.tags.includes(dominantTag));

  if (restArticles.length < cap) {
    const topUp = await fetchGuardianArticles(
      { q: `NOT "${dominantTeamName}"` },
      cap - restArticles.length + 10
    );
    const existingIds = new Set(restArticles.map((a) => a.id));
    restArticles = [...restArticles, ...topUp.filter((a) => !existingIds.has(a.id))];
  }

  const merged = [...dominantArticles, ...restArticles];
  merged.sort((a, b) => new Date(b.published) - new Date(a.published));
  return merged;
};

export default function NewsFeedScreen() {
  const { favoriteTeam, bookmarks, bookmarksLoading, isBookmarked, toggleBookmark } = useAuth();
  const [feedMode, setFeedMode] = useState('league'); // 'league' | 'team' | 'saved'
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [containerHeight, setContainerHeight] = useState(SCREEN_HEIGHT);
  const flatListRef = useRef(null);
  // Guards against a slower, earlier fetch (e.g. from a feed toggle the
  // user already switched away from) resolving after a newer one and
  // clobbering the current feed with stale data.
  const requestIdRef = useRef(0);

  // If the user's favorite team changes (or clears) while already on the
  // team tab, fall back to the league feed rather than showing a stale team.
  useEffect(() => {
    if (feedMode === 'team' && !favoriteTeam) {
      setFeedMode('league');
    }
  }, [favoriteTeam, feedMode]);

  // Saved articles come straight from the live bookmarks list in context —
  // no network fetch, and it stays in sync as the user bookmarks/unbookmarks.
  useEffect(() => {
    if (feedMode === 'saved') {
      setLoading(false);
      setError(null);
      return;
    }
    fetchNews();
  }, [feedMode, favoriteTeam]);

  const displayedArticles = feedMode === 'saved' ? bookmarks : articles;
  const isLoading = feedMode === 'saved' ? bookmarksLoading : loading;

  const fetchNews = async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);

      let mappedArticles;
      if (feedMode === 'team' && favoriteTeam) {
        // Quote the team name so "Manchester United" doesn't match on the
        // bare word "Manchester" in Manchester City coverage. order-by
        // switches to relevance here too — sorting a team search by newest
        // surfaces any article that mentions the team in passing (e.g. a
        // rival-club piece) ahead of articles actually about them.
        mappedArticles = await fetchGuardianArticles({
          q: `"${favoriteTeam}"`,
          'from-date': oneMonthAgoISODate(),
          'order-by': 'relevance',
        });
      } else {
        mappedArticles = await fetchLeagueFeed();
      }

      // A newer request (from a feed toggle switch) may have started and
      // already finished while this one was in flight — ignore this result.
      if (requestId !== requestIdRef.current) return;

      setArticles(mappedArticles);
      console.log('Fetched', mappedArticles.length, 'articles');
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error fetching news:', err);
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handleToggleBookmark = async (article) => {
    const result = await toggleBookmark(article);
    if (!result.success) {
      showAlert('Error', result.error);
    }
  };

  const feedToggle = (
    <View style={styles.toggleWrap} pointerEvents="box-none">
      <View style={styles.toggleBar}>
        <TouchableOpacity
          style={[styles.toggleButton, feedMode === 'league' && styles.toggleButtonActive]}
          onPress={() => setFeedMode('league')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleButtonText, feedMode === 'league' && styles.toggleButtonTextActive]}>
            PL News
          </Text>
        </TouchableOpacity>
        {favoriteTeam && (
          <TouchableOpacity
            style={[styles.toggleButton, styles.toggleButtonWithBadge, feedMode === 'team' && styles.toggleButtonActive]}
            onPress={() => setFeedMode('team')}
            activeOpacity={0.8}
          >
            {TEAM_BADGES[favoriteTeam] && (
              <Image source={{ uri: TEAM_BADGES[favoriteTeam] }} style={styles.toggleBadge} resizeMode="contain" />
            )}
            <Text
              style={[styles.toggleButtonText, feedMode === 'team' && styles.toggleButtonTextActive]}
              numberOfLines={1}
            >
              {favoriteTeam}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.toggleButton, styles.toggleButtonWithBadge, feedMode === 'saved' && styles.toggleButtonActive]}
          onPress={() => setFeedMode('saved')}
          activeOpacity={0.8}
        >
          <FontAwesome
            name="bookmark"
            size={13}
            color={feedMode === 'saved' ? '#fff' : 'rgba(255, 255, 255, 0.7)'}
            style={styles.toggleBookmarkIcon}
          />
          <Text style={[styles.toggleButtonText, feedMode === 'saved' && styles.toggleButtonTextActive]}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {feedToggle}
        <ActivityIndicator size="large" color="#38003c" />
        <Text style={styles.loadingText}>
          {feedMode === 'saved' ? 'Loading Saved Articles...' : 'Loading Premier League News...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        {feedToggle}
        <Text style={styles.emptyText}>⚠️</Text>
        <Text style={styles.emptyTitle}>Couldn't Load News</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (displayedArticles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {feedToggle}
        <Text style={styles.emptyText}>{feedMode === 'saved' ? '🔖' : '📰'}</Text>
        <Text style={styles.emptyTitle}>
          {feedMode === 'team'
            ? `No Recent ${favoriteTeam} News`
            : feedMode === 'saved'
            ? 'No Saved Articles'
            : 'No Articles Found'}
        </Text>
        {feedMode === 'saved' ? (
          <Text style={styles.emptySubtitle}>Tap the bookmark icon on any article to save it here.</Text>
        ) : (
          <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const measuredHeight = e.nativeEvent.layout.height;
        if (measuredHeight > 0) {
          setContainerHeight(measuredHeight);
        }
      }}
    >
      {feedToggle}
      <FlatList
        ref={flatListRef}
        data={displayedArticles}
        renderItem={({ item }) => (
          <NewsCard
            article={item}
            height={containerHeight}
            isBookmarked={isBookmarked(item.id)}
            onToggleBookmark={() => handleToggleBookmark(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={containerHeight}
        snapToAlignment="start"
        disableIntervalMomentum
        getItemLayout={(data, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toggleWrap: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    maxWidth: 200,
  },
  toggleButtonWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleBadge: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  toggleBookmarkIcon: {
    marginRight: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#38003c',
  },
  toggleButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#38003c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});