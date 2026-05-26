import { useState, useRef } from "react";
import { View, TextInput, TouchableOpacity, Text, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDebounce } from "@/hooks/useDebounce";

const DEBOUNCE_MS = 500;
const MIN_CHARS = 3;

interface SearchBarProps {
  onSearch: (query: string) => void;
  autoFocus?: boolean;
  liveSearch?: boolean;
}

export function SearchBar({ onSearch, autoFocus, liveSearch = false }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [showVoiceTip, setShowVoiceTip] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useDebounce(
    () => {
      if (!liveSearch) return;
      const trimmed = value.trim();
      if (trimmed.length >= MIN_CHARS) onSearch(trimmed);
    },
    DEBOUNCE_MS,
    [value]
  );

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed.length >= MIN_CHARS) onSearch(trimmed);
  }

  function handleClear() {
    setValue("");
    inputRef.current?.focus();
  }

  function handleMic() {
    // Abre el teclado y muestra el tip del micrófono nativo
    inputRef.current?.focus();
    Keyboard.dismiss();
    setTimeout(() => {
      inputRef.current?.focus();
      setShowVoiceTip(true);
      setTimeout(() => setShowVoiceTip(false), 3000);
    }, 100);
  }

  return (
    <View>
      <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 gap-3">
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          ref={inputRef}
          className="flex-1 text-base text-gray-900 dark:text-white"
          placeholder="Buscar medicamento..."
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 ? (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleMic} hitSlop={8}>
            <Ionicons name="mic-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={value.trim().length < MIN_CHARS}
          className="bg-green-600 rounded-xl px-4 py-1.5 disabled:opacity-40"
        >
          <Text className="text-white font-semibold text-sm">Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Tip micrófono */}
      {showVoiceTip && (
        <View className="mt-2 bg-gray-800 dark:bg-gray-700 rounded-xl px-4 py-2.5 flex-row items-center gap-2">
          <Ionicons name="mic" size={14} color="#4ade80" />
          <Text className="text-white text-xs flex-1">
            Toca el micrófono 🎤 en tu teclado para buscar por voz
          </Text>
        </View>
      )}
    </View>
  );
}
