import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const ONBOARDING_KEY = "onboarding_v1_done";

const SLIDES = [
  {
    icon: "storefront-outline" as const,
    iconColor: "#16a34a",
    title: "Compara precios al instante",
    body: "Busca cualquier medicamento y ve en segundos cuánto cuesta en Cruz Verde, Salcobrand, Farmacias Ahumada y Dr. Simi.",
  },
  {
    icon: "pricetag-outline" as const,
    iconColor: "#2563eb",
    title: "Hay 4 formas de ahorrar",
    body: "Cada farmacia tiene precios distintos según cómo compres:\n\n🏪  Presencial — en la tienda\n🌐  Online — por su sitio web\n💳  T. Más / CMR — con tarjeta\n📱  SBPay — app de Salcobrand",
  },
  {
    icon: "heart-outline" as const,
    iconColor: "#e11d48",
    title: "Guarda y comparte",
    body: "Marca tus medicamentos favoritos con ❤️ para acceder rápido. Comparte el mejor precio con tus contactos con un toque.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  async function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * next, animated: true });
      setCurrentIndex(next);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, "1");
      router.replace("/" as any);
    }
  }

  function handleScroll(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(idx);
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {SLIDES.map((slide, i) => (
          <View
            key={i}
            style={{ width: SCREEN_WIDTH }}
            className="flex-1 items-center justify-center px-8"
          >
            <View className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 mb-8">
              <Ionicons name={slide.icon} size={64} color={slide.iconColor} />
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
              {slide.title}
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6">
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View className="flex-row justify-center gap-2 mb-6">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex
                ? "bg-green-600 w-6"
                : "bg-gray-200 dark:bg-gray-700 w-2"
            }`}
          />
        ))}
      </View>

      {/* Botón */}
      <View className="px-6 pb-8">
        <TouchableOpacity
          onPress={handleNext}
          className="bg-green-600 rounded-2xl py-4 items-center flex-row justify-center gap-2"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-base">
            {isLast ? "¡Comenzar!" : "Siguiente"}
          </Text>
          <Ionicons
            name={isLast ? "rocket-outline" : "arrow-forward"}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.setItem(ONBOARDING_KEY, "1");
              router.replace("/" as any);
            }}
            className="mt-3 items-center"
          >
            <Text className="text-gray-400 text-sm">Saltar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
