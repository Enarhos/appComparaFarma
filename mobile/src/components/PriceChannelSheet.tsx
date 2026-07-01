import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const CHANNELS = [
  {
    icon: "storefront-outline" as const,
    label: "Presencial",
    color: "#6b7280",
    description: "Precio al comprar en una sucursal física. No requiere tarjeta ni app adicional.",
    detail: null,
  },
  {
    icon: "globe-outline" as const,
    label: "Online",
    color: "#2563eb",
    description: "Precio especial al comprar en el sitio web o app de la farmacia.",
    detail: "Dr. Simi · Salcobrand",
  },
  {
    icon: "card-outline" as const,
    label: "T. Más",
    color: "#003087",
    description: "Precio exclusivo con la Tarjeta Más de Salcobrand.",
    detail: "Salcobrand",
  },
  {
    icon: "phone-portrait-outline" as const,
    label: "SBPay",
    color: "#1d4ed8",
    description: "Precio al pagar con la billetera digital SBPay en la app de Salcobrand.",
    detail: "Salcobrand",
  },
  {
    icon: "card-outline" as const,
    label: "CMR",
    color: "#e31837",
    description: "Precio con tarjeta CMR Falabella en Farmacias Ahumada.",
    detail: "Farmacias Ahumada",
  },
  {
    icon: "medical-outline" as const,
    label: "Fonasa",
    color: "#7c3aed",
    description: "Precio para beneficiarios Fonasa al comprar en Farmex.",
    detail: "Farmex",
  },
  {
    icon: "star-outline" as const,
    label: "Plus",
    color: "#16a34a",
    description: "Precio con el programa de beneficios Plus de EasyFarma.",
    detail: "EasyFarma",
  },
];

export function PriceChannelSheet({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View className="bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-4 pb-8" style={styles.sheet}>
          {/* Handle */}
          <View className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full self-center mb-4" />

          {/* Header */}
          <View className="flex-row items-center gap-3 mb-2">
            <View className="bg-green-50 dark:bg-green-950 rounded-full p-2">
              <Ionicons name="pricetags-outline" size={18} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 dark:text-white">
                Tipos de precio
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                Cada farmacia ofrece distintos canales de compra
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {CHANNELS.map((ch, i) => (
              <View
                key={ch.label}
                className={`flex-row items-start gap-3 py-3 ${
                  i < CHANNELS.length - 1 ? "border-b border-gray-50 dark:border-gray-800" : ""
                }`}
              >
                <View
                  className="rounded-full p-2"
                  style={{ backgroundColor: ch.color + "22" }}
                >
                  <Ionicons name={ch.icon} size={16} color={ch.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {ch.label}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-5">
                    {ch.description}
                  </Text>
                  {ch.detail && (
                    <Text className="text-xs text-green-600 dark:text-green-400 mt-0.5 font-medium">
                      {ch.detail}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "85%",
  },
});
