import { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

function Block({ w, h = 12 }: { w: DimensionValue; h?: number }) {
  return (
    <View
      style={{ width: w, height: h }}
      className="bg-gray-200 dark:bg-gray-700 rounded-lg"
    />
  );
}

export function SkeletonCard() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={animStyle}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex-row items-center gap-3"
    >
      {/* Placeholder imagen */}
      <View className="w-[52px] h-[52px] rounded-xl bg-gray-200 dark:bg-gray-700" />

      {/* Placeholder texto */}
      <View className="flex-1 gap-2">
        <Block w="75%" h={14} />
        <Block w="45%" h={10} />
        <View className="flex-row gap-2 mt-1">
          <Block w={90} h={20} />
          <Block w={80} h={20} />
        </View>
      </View>

      {/* Placeholder chevron */}
      <View className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
    </Animated.View>
  );
}
