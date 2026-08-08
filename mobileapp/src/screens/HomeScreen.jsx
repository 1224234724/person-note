import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradientColors } from '../utils/theme';
import api from '../utils/api';

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const data = await api.get('/api/posts');
      setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Detail', { id: item.id, title: item.title })}
    >
      <View style={styles.cardInner}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardSummary} numberOfLines={2}>
          {item.summary || item.content?.slice(0, 80) || ''}
        </Text>
        <View style={styles.cardMeta}>
          {item.tags?.split(',').filter(Boolean).slice(0, 2).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag.trim()}</Text>
            </View>
          ))}
          <Text style={styles.cardDate}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      {/* 顶部横幅 */}
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>✦ 我的博客 ✦</Text>
        <Text style={styles.headerSub}>记录学习 · 技术 · 生活</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>暂无文章</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 50, paddingBottom: 28, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 6 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 16, marginBottom: 14,
    overflow: 'hidden',
  },
  cardInner: { padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: colors.textMain, marginBottom: 8 },
  cardSummary: { fontSize: 13, color: colors.textSub, lineHeight: 20, marginBottom: 12 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: 'rgba(124,92,255,0.2)', borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: colors.accent },
  cardDate: { marginLeft: 'auto', fontSize: 12, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 15 },
});
