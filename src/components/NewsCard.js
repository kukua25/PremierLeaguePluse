import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as WebBrowser from 'expo-web-browser';

// Above this width, a narrow full-bleed mobile card just leaves a wall of
// empty space on either side. Instead, lay the article out landscape — big
// image on the left, headline/text on the right — like a desktop site's
// top-story hero, filling the width meaningfully instead of floating a
// phone-shaped column in the middle of the screen.
const WIDE_BREAKPOINT = 700;
const HERO_MAX_WIDTH = 1200;
const HERO_SIDE_MARGIN = 160;
const HERO_VERTICAL_MARGIN = 120;

export default function NewsCard({ article, height, isBookmarked, onToggleBookmark }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const rowHeight = height ?? windowHeight;
  const isWide = windowWidth >= WIDE_BREAKPOINT;

  const imageUrl = article.imageUrl ?? null;
  const articleUrl = article.links?.[0]?.url ?? null;
  const description = article.description?.replace(/<[^>]*>/g, '');
  const formattedDate = new Date(article.published).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePress = async () => {
    if (!articleUrl) return;
    if (Platform.OS === 'web') {
      window.open(articleUrl, '_blank');
    } else {
      await WebBrowser.openBrowserAsync(articleUrl);
    }
  };

  const bookmarkButton = onToggleBookmark && (
    <TouchableOpacity
      style={styles.bookmarkButton}
      onPress={(e) => {
        // On web, a tap here can otherwise bubble up to the card's own
        // onPress (which opens the article) — native doesn't have this
        // issue, but stopping propagation here is a safe no-op there.
        e.stopPropagation?.();
        onToggleBookmark();
      }}
      activeOpacity={0.8}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <FontAwesome
        name={isBookmarked ? 'bookmark' : 'bookmark-o'}
        size={18}
        color="#fff"
      />
    </TouchableOpacity>
  );

  if (isWide) {
    const cardWidth = Math.min(windowWidth - HERO_SIDE_MARGIN, HERO_MAX_WIDTH);
    const cardHeight = Math.min(rowHeight - HERO_VERTICAL_MARGIN, cardWidth * 0.58);

    return (
      <View style={[styles.row, { width: windowWidth, height: rowHeight }]}>
        <TouchableOpacity
          style={[styles.heroCard, { width: cardWidth, height: cardHeight }]}
          onPress={handlePress}
          activeOpacity={0.95}
        >
          <View style={styles.heroImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderBackground}>
                <Text style={styles.placeholderText}>The Guardian</Text>
              </View>
            )}
            {bookmarkButton}
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle} numberOfLines={4}>{article.title}</Text>
            <Text style={styles.heroDescription} numberOfLines={5}>{description}</Text>

            <View style={styles.footer}>
              <Text style={styles.source}>The Guardian</Text>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>

            <Text style={styles.tapHint}>Tap to read full article →</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, { width: windowWidth, height: rowHeight }]} onPress={handlePress} activeOpacity={0.95}>
      {/* Image fills the top portion */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderBackground}>
            <Text style={styles.placeholderText}>The Guardian</Text>
          </View>
        )}
        {/* Fade edge between image and content */}
        <View style={styles.imageFade} />
        {bookmarkButton}
      </View>

      {/* Content sized to fit its text; image above absorbs the remaining space */}
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={3}>{article.title}</Text>

        <Text style={styles.description} numberOfLines={3}>{description}</Text>

        <View style={styles.footer}>
          <Text style={styles.source}>The Guardian</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        <Text style={styles.tapHint}>Tap to read full article →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bookmarkButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  row: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#0d0014',
    flexDirection: 'column',
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: '#0d0014',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 16,
  },
  heroImageContainer: {
    flex: 1.2,
    height: '100%',
    position: 'relative',
  },
  heroContent: {
    flex: 1,
    height: '100%',
    padding: 40,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 40,
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 17,
    color: '#ccc',
    lineHeight: 26,
    marginBottom: 28,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#38003c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  imageFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(13, 0, 20, 0.9)',
  },
  contentContainer: {
    backgroundColor: '#0d0014',
    padding: 20,
    paddingTop: 16,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 28,
  },
  description: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 21,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  source: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#aaa',
  },
  tapHint: {
    fontSize: 13,
    color: '#9b59b6',
    fontWeight: '500',
  },
});
