import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import DetailScreen from './src/screens/DetailScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { colors } from './src/utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.textMain,
  headerTitleStyle: { fontWeight: 'bold' },
  contentStyle: { backgroundColor: colors.bg },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '文章详情' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: '隐私政策' }} />
    </Stack.Navigator>
  );
}

// 简单隐私页（内嵌）
import { ScrollView, View, Text, StyleSheet } from 'react-native';
function PrivacyScreen() {
  const sections = [
    ['一、引言', '本隐私政策适用于「王雨的博客」App，我们非常重视您的隐私保护。'],
    ['二、收集的信息', '账号登录信息（用户名）、留言内容、文章阅读记录（不含个人身份）。'],
    ['三、信息用途', '仅用于登录识别、留言展示，不用于商业目的，不向第三方共享。'],
    ['四、数据安全', '信息存储于安全服务器，采取合理技术措施保护数据安全。'],
    ['五、联系我们', '如有疑问可通过留言板与我们联系。'],
  ];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {sections.map(([title, content]) => (
        <View key={title} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.primary, marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: colors.textSub, lineHeight: 22 }}>{content}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            height: 60,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 12, marginBottom: 6 },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              首页: focused ? 'home' : 'home-outline',
              留言: focused ? 'chatbubbles' : 'chatbubbles-outline',
              我的: focused ? 'person' : 'person-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="首页" component={HomeStack} />
        <Tab.Screen name="留言" component={MessagesScreen} />
        <Tab.Screen name="我的" component={ProfileStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
