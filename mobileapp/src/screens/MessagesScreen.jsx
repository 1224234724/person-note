import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../utils/theme';
import api from '../utils/api';

export default function MessagesScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMessages = async () => {
    try {
      const data = await api.get('/api/messages');
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMessages();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    const token = await AsyncStorage.getItem('token');
    if (!token) { Alert.alert('提示', '请先登录后留言'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/messages', { content: content.trim() });
      setContent('');
      fetchMessages();
    } catch (e) {
      Alert.alert('发送失败', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.msgCard}>
      <View style={styles.msgHeader}>
        <Text style={styles.msgNickname}>{item.nickname || item.username || '匿名'}</Text>
        <Text style={styles.msgDate}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : ''}
        </Text>
      </View>
      <Text style={styles.msgContent}>{item.content}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❄ 留言板</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<Text style={styles.empty}>暂无留言，来说点什么吧～</Text>}
        />
      )}

      {/* 输入框 */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="说点什么..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.sendBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.sendText}>{submitting ? '发送中' : '发送'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 50, paddingBottom: 18, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  list: { padding: 16, paddingBottom: 16 },
  msgCard: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 14, marginBottom: 12,
  },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  msgNickname: { fontSize: 13, fontWeight: 'bold', color: colors.accent },
  msgDate: { fontSize: 11, color: colors.textMuted },
  msgContent: { fontSize: 14, color: colors.textSub, lineHeight: 22 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 60, fontSize: 15 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.tabBar, gap: 10,
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 10, color: colors.textMain, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  sendText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
