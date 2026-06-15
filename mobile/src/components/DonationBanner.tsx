import { useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { DONATION_CONFIG } from "@/constants/donation";
import { formatCLP } from "@/lib/formatters";

interface Props {
  savings: number;
}

interface BankField {
  label: string;
  value: string;
}

export function DonationBanner({ savings }: Props) {
  const [selectedAmount, setSelectedAmount] = useState<number | "otro" | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (savings <= DONATION_CONFIG.threshold) return null;

  const { bank, amounts } = DONATION_CONFIG;

  const fields: BankField[] = [
    { label: "Banco", value: bank.banco },
    { label: "Tipo de cuenta", value: bank.tipoCuenta },
    { label: "N° de cuenta", value: bank.numeroCuenta },
    { label: "RUT", value: bank.rut },
    { label: "Nombre", value: bank.nombre },
    { label: "Email", value: bank.email },
    ...(selectedAmount && selectedAmount !== "otro"
      ? [{ label: "Monto", value: formatCLP(selectedAmount) }]
      : []),
  ];

  async function handleCopy(field: BankField) {
    await Clipboard.setStringAsync(field.value);
    setCopiedField(field.label);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleAmount(amount: number | "otro") {
    setSelectedAmount((prev) => (prev === amount ? null : amount));
  }

  return (
    <View className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-4 gap-3">
      {/* Header */}
      <View className="flex-row items-center gap-2">
        <Ionicons name="heart-outline" size={16} color="#16a34a" />
        <Text className="text-sm font-bold text-green-800 dark:text-green-300 flex-1">
          ¿Te ayudamos a ahorrar {formatCLP(savings)}?
        </Text>
      </View>

      <Text className="text-xs text-green-700 dark:text-green-400 leading-4">
        ComparaFarma es gratuita y sin publicidad. Si te fue útil, puedes apoyar el proyecto con una transferencia voluntaria.
      </Text>

      {/* Botones de monto */}
      <View className="flex-row flex-wrap gap-2">
        {amounts.map((amount) => {
          const active = selectedAmount === amount;
          return (
            <TouchableOpacity
              key={amount}
              onPress={() => handleAmount(amount)}
              activeOpacity={0.7}
              className={`rounded-xl px-4 py-2 border ${
                active
                  ? "bg-green-600 border-green-600"
                  : "bg-white dark:bg-gray-800 border-green-200 dark:border-green-700"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? "text-white" : "text-green-700 dark:text-green-300"
                }`}
              >
                {formatCLP(amount)}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={() => handleAmount("otro")}
          activeOpacity={0.7}
          className={`rounded-xl px-4 py-2 border ${
            selectedAmount === "otro"
              ? "bg-green-600 border-green-600"
              : "bg-white dark:bg-gray-800 border-green-200 dark:border-green-700"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              selectedAmount === "otro" ? "text-white" : "text-green-700 dark:text-green-300"
            }`}
          >
            Otro monto
          </Text>
        </TouchableOpacity>
      </View>

      {/* Datos bancarios */}
      {selectedAmount !== null && (
        <View className="bg-white dark:bg-gray-800 rounded-xl border border-green-100 dark:border-green-800 overflow-hidden">
          {fields.map((field, i) => (
            <TouchableOpacity
              key={field.label}
              onPress={() => handleCopy(field)}
              activeOpacity={0.6}
              className={`flex-row items-center justify-between px-4 py-3 ${
                i < fields.length - 1 ? "border-b border-gray-50 dark:border-gray-700" : ""
              }`}
            >
              <View className="flex-1 mr-3">
                <Text className="text-xs text-gray-400 mb-0.5">{field.label}</Text>
                <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {field.value}
                </Text>
              </View>
              {copiedField === field.label ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                  <Text className="text-xs text-green-600 font-medium">Copiado</Text>
                </View>
              ) : (
                <Ionicons name="copy-outline" size={16} color="#9ca3af" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedAmount !== null && (
        <Text className="text-xs text-gray-400 text-center">
          Toca cualquier campo para copiarlo
        </Text>
      )}
    </View>
  );
}
