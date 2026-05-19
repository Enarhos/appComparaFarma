import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

function Block({ w, h = 12 }: { w: number; h?: number }) {
  return <View style={{ width: `${w}%`, height: h }} className="bg-gray-200 rounded" />;
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
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
    >
      {/* Encabezado: nombre + precio */}
      <View className="px-4 pt-4 pb-2 flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-2">
          <Block w={72} h={14} />
          <Block w={40} h={10} />
        </View>
        <View className="items-end gap-1">
          <Block w={100} h={10} />
          <Block w={100} h={18} />
        </View>
      </View>

      {/* Filas de farmacia */}
      <View className="px-4 pb-3 border-t border-gray-50 mt-1">
        {[0, 1, 2].map((i) => (
          <View key={i} className="py-3 border-b border-gray-50">
            <View className="mb-2">
              <Block w={35} h={16} />
            </View>
            <View className="flex-row gap-3">
              <Block w={28} h={12} />
              <Block w={28} h={12} />
              <Block w={28} h={12} />
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}
