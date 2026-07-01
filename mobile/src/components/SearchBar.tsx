import { useState, useRef } from "react";
import { View, TextInput, TouchableOpacity, Text, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDebounce } from "@/hooks/useDebounce";

const DEBOUNCE_MS = 500;
const MIN_CHARS = 3;
const MAX_SUGGESTIONS = 5;

interface SearchBarProps {
  onSearch: (query: string) => void;
  autoFocus?: boolean;
  liveSearch?: boolean;
  suggestions?: string[];
}

export function SearchBar({ onSearch, autoFocus, liveSearch = false, suggestions = [] }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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

  // Sugerencias filtradas según lo que el usuario escribe
  const trimmedLower = value.trim().toLowerCase();
  const filteredSuggestions =
    trimmedLower.length >= 1
      ? suggestions
          .filter(
            (s) =>
              s.toLowerCase().includes(trimmedLower) &&
              s.toLowerCase() !== trimmedLower
          )
          // dedup case-insensitive: keep first occurrence of each lowercase value
          .filter((s, i, arr) => arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i)
          .slice(0, MAX_SUGGESTIONS)
      : [];

  const showSuggestions = isFocused && filteredSuggestions.length > 0;

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed.length >= MIN_CHARS) {
      setIsFocused(false);
      Keyboard.dismiss();
      onSearch(trimmed);
    }
  }

  function handleClear() {
    setValue("");
    inputRef.current?.focus();
  }

  function handleSelectSuggestion(suggestion: string) {
    setValue(suggestion);
    setIsFocused(false);
    Keyboard.dismiss();
    onSearch(suggestion);
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          returnKeyType="search"
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
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

      {/* Dropdown de sugerencias */}
      {showSuggestions && (
        <View className="mt-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {filteredSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={suggestion}
              onPress={() => handleSelectSuggestion(suggestion)}
              activeOpacity={0.7}
              className={`flex-row items-center gap-3 px-4 py-3 ${
                index < filteredSuggestions.length - 1
                  ? "border-b border-gray-50 dark:border-gray-700"
                  : ""
              }`}
            >
              <Ionicons name="search-outline" size={15} color="#9ca3af" />
              <Text className="flex-1 text-gray-700 dark:text-gray-300 text-sm">
                {suggestion}
              </Text>
              <Ionicons name="return-down-back-outline" size={14} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>
      )}

    </View>
  );
}
