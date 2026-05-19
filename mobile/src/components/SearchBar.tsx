import { useState, useRef } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
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
    if (trimmed.length >= 2) onSearch(trimmed);
  }

  function handleClear() {
    setValue("");
    inputRef.current?.focus();
  }

  return (
    <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 gap-3">
      <Text className="text-gray-400 text-lg">🔍</Text>
      <TextInput
        ref={inputRef}
        className="flex-1 text-base text-gray-900"
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
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <Text className="text-gray-400 text-lg">✕</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={value.trim().length < 2}
        className="bg-green-600 rounded-xl px-4 py-1.5 disabled:opacity-40"
      >
        <Text className="text-white font-semibold text-sm">Buscar</Text>
      </TouchableOpacity>
    </View>
  );
}
