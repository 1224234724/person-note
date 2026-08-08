import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, Share,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import api from '../utils/api';

export default function DetailScreen({ route, navigation }) {
  const { id, title } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: title || '文章详情' });
    api.get(`/api/posts/${id}`)
      .then(setPost)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    await Share.share({ message: `${post?.title}\n\n${post?.summary || ''}` });
  };

  const markdownStyles = {
    body: { color: colors.textSub, fontSize: 15, lineHeight: 26 },
    heading1: { color: colors.textMain, fontSize: 22, fontWeight: 'bold', marginVertical: 12 },
    heading2: { color: colors.textMain, fontSize: 19, fontWeight: 'bold', marginVertical: 10 },
    heading3: { color: colors.accent, fontSize: 17, fontWeight: 'bold', marginVertical: 8 },
    code_inline: { backgroundColor: 'rgba(124,92,255,0.15)', color: colors.accent, borderRadius: 4, paddingHorizontal: 6 },
    fence: { backgroundColor: '#1a1535', borderRadius: 10, padding: 14, marginVertical: 12 },
    blockquote: { backgroundColor: 'rgba(124,92,255,0.1)', borderLeftWidth: 4, borderLeftColor: colors.primary, paddingLeft: 12, marginVertical: 8 },
    link: { color: colors.accent },
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{post?.title}</Text>
        <View style={styles.meta}>
          {post?.tags?.split(',').filter(Boolean).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag.trim()}</Text>
            </View>
          ))}
          <Text style={styles.date}>
            {post?.created_at ? new Date(post.created_at).toLocaleDateString('zh-CN') : ''}
          </Text>
        </View>
        <View style={styles.divider} />
        <Markdown style={markdownStyles}>{post?.content || ''}</Markdown>
      </ScrollView>

      {/* 底部工具栏 */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={[styles.toolBtn, liked && styles.toolBtnActive]} onPress={() => setLiked(!liked)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#ff6ec7' : colors.textMuted} />
          <Text style={[styles.toolText, liked && { color: '#ff6ec7' }]}>喜欢</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={colors.textMuted} />
          <Text style={styles.toolText}>分享</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textMain, lineHeight: 32, marginBottom: 14 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 },
  tag: {
    backgroundColor: 'rgba(124,92,255,0.2)', borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: colors.accent },
  date: { fontSize: 12, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 20 },
  toolbar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: colors.tabBar,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingVertical: 12, paddingHorizontal: 40,
    justifyContent: 'space-around',
  },
  toolBtn: { alignItems: 'center', gap: 4 },
  toolBtnActive: {},
  toolText: { fontSize: 12, color: colors.textMuted },
});
