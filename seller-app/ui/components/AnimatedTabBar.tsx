import { useEffect, useMemo, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { Text } from './Text';

type TabDef = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  { key: 'index', label: 'Dashboard', icon: 'home-outline' },
  { key: 'orders', label: 'Orders', icon: 'list-outline' },
  { key: 'products', label: 'Product', icon: 'water-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' },
];

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const tabCount = state.routes.length;

  const activeIndex = state.index;
  const indicatorX = useSharedValue(0);

  const itemWidth = useMemo(() => (width > 0 ? width / tabCount : 0), [width, tabCount]);

  useEffect(() => {
    if (!itemWidth) return;
    indicatorX.value = withSpring(activeIndex * itemWidth, {
      damping: 18,
      stiffness: 180,
      mass: 0.7,
    });
  }, [activeIndex, itemWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  return (
    <View
      onLayout={onLayout}
      style={{
        backgroundColor: theme.colors.tabBar,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 12,
      }}
    >
      <View style={{ height: 54, borderRadius: 18, backgroundColor: '#FFFFFF' }}>
        {itemWidth ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: itemWidth,
                height: 54,
                padding: 8,
              },
              indicatorStyle,
            ]}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: 'rgba(18,101,214,0.10)',
              }}
            />
          </Animated.View>
        ) : null}

        <View style={{ flexDirection: 'row', height: 54 }}>
          {state.routes.map((route, index) => {
            const options = descriptors[route.key]?.options;
            const label =
              options?.tabBarLabel?.toString() ??
              (typeof options?.title === 'string' ? options.title : undefined) ??
              route.name;
            const isFocused = state.index === index;

            const def = TABS.find((t) => t.key === route.name);
            const iconName = def?.icon ?? 'ellipse-outline';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? theme.colors.primary : 'rgba(18,101,214,0.55)'}
                />
                <Text
                  variant="chip"
                  weight="extrabold"
                  style={{ color: isFocused ? theme.colors.primary : 'rgba(18,101,214,0.55)' }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

