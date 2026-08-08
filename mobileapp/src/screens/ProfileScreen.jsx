import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradientColors } from '../utils/theme';
import api from '../utils/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then((u) => {
      if (u) setUser(JSON.parse(u));
    });
  }, []);

  const handleLogin = async () => {
    try {
      // App 端用账号密码登录（网页端已有接口）
      navigation.navigate('Login');
    } catch (e) {
      Alert.alert('登录失败', e.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确认退出？', [
      { text: '取消' },
      {
        text: '退出', style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user']);
          setUser(null);
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'document-text-outline', label: '我的博客', onPress: () => navigation.navigate('Home') },
    { icon: 'chatbubble-outline', label: '留言板', onPress: () => navigation.navigate('Messages') },
    { icon: 'shield-outline', label: '隐私政策', onPress: () => navigation.navigate('Privacy') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 头部 */}
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.avatarWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.avatar} />
        </View>
        <Text style={styles.name}>{user?.nickname || user?.username || '未登录'}</Text>
        <Text style={styles.sub}>{user ? (user.is_admin ? '管理员 ❄✨' : '欢迎回来～ ❄') : '登录后可参与互动'}</Text>
      </LinearGradient>

      {/* 菜单 */}
      <View style={styles.card}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.menuItem, i < menuItems.length - 1 && styles.menuBorder]} onPress={item.onPress}>
            <Ionicons name={item.icon} size={20} color={colors.primary} style={{ marginRight: 14 }} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* 登录/退出按钮 */}
      {user ? (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginGrad}>
            <Text style={styles.loginText}>账号登录</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingTop: 60, paddingBottom: 36, alignItems: 'center',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden', marginBottom: 14,
  },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  card: {
    margin: 16, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { fontSize: 15, color: colors.textMain },
  loginBtn: { margin: 16, borderRadius: 14, overflow: 'hidden' },
  loginGrad: { paddingVertical: 14, alignItems: 'center' },
  loginText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: {
    margin: 16, borderWidth: 1, borderColor: 'rgba(255,100,100,0.4)',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { color: '#ff6b6b', fontSize: 15 },
});
