import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AiChatScreen } from './AiChatScreen';

const Drawer = createDrawerNavigator();

function CustomSidebarContent() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.sidebar, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.sidebarTitle}>Chat History</Text>
    </View>
  );
}

export function ChatDrawerScreen() {
  return (
    <NavigationContainer independent>
      <Drawer.Navigator
        drawerContent={() => <CustomSidebarContent />}
        screenOptions={{
        headerStyle: {
          backgroundColor: '#000',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitle: 'Hira',
        headerTitleAlign: 'center',
        headerLeft: ({ navigation }) => (
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerLeft} accessibilityLabel="Open menu">
            <MaterialCommunityIcons name="menu" size={28} color="#007AFF" />
          </TouchableOpacity>
        ),
        headerRight: () => null,
        drawerStyle: {
          backgroundColor: '#111',
          width: 280,
        },
        }}
      >
        <Drawer.Screen name="Chat" component={AiChatScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerLeft: {
    marginLeft: 15,
  },
});
