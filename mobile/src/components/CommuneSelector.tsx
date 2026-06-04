import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocationStore } from "@/store/locationStore";
import { getBranchIndex, getCommuneList, type BranchIndex } from "@/lib/branches";

interface CommuneItem {
  key: string;
  nombre: string;
  region: string;
}

export function CommuneSelector() {
  const { selectedCommuneName, selectedRegion, setCommune, clearCommune } = useLocationStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<BranchIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Carga el índice cuando se abre el modal
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getBranchIndex().then((idx) => {
      setIndex(idx);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    });
  }, [open]);

  const communes: CommuneItem[] = index ? getCommuneList(index) : [];

  const filtered = query.trim().length >= 1
    ? communes.filter((c) =>
        c.nombre.toLowerCase().includes(query.toLowerCase()) ||
        c.region.toLowerCase().includes(query.toLowerCase())
      )
    : communes;

  function handleSelect(item: CommuneItem) {
    setCommune({ key: item.key, nombre: item.nombre, region: item.region });
    setOpen(false);
    setQuery("");
  }

  function handleClear() {
    clearCommune();
  }

  return (
    <>
      {/* Chip selector en el Home */}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
          className="flex-1 flex-row items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3"
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={selectedCommuneName ? "#16a34a" : "#9ca3af"}
          />
          <View className="flex-1">
            {selectedCommuneName ? (
              <>
                <Text className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {selectedCommuneName}
                </Text>
                <Text className="text-xs text-gray-400" numberOfLines={1}>
                  {selectedRegion}
                </Text>
              </>
            ) : (
              <Text className="text-sm text-gray-400">Todas las comunas</Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={14} color="#9ca3af" />
        </TouchableOpacity>

        {selectedCommuneName && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={8}
            className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center"
          >
            <Ionicons name="close" size={16} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de búsqueda */}
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-white dark:bg-gray-900">
          {/* Header */}
          <View className="flex-row items-center gap-3 px-4 pt-12 pb-3 border-b border-gray-100 dark:border-gray-800">
            <TouchableOpacity onPress={() => { setOpen(false); setQuery(""); }} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#6b7280" />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar comuna..."
              placeholderTextColor="#9ca3af"
              className="flex-1 text-base text-gray-900 dark:text-white"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Opción "Todas" */}
          <TouchableOpacity
            onPress={() => { clearCommune(); setOpen(false); setQuery(""); }}
            activeOpacity={0.7}
            className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-50 dark:border-gray-800"
          >
            <View className="w-8 h-8 bg-green-50 dark:bg-green-950 rounded-full items-center justify-center">
              <Ionicons name="globe-outline" size={16} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-green-700 dark:text-green-400">
                Todas las comunas
              </Text>
              <Text className="text-xs text-gray-400">Sin filtro geográfico</Text>
            </View>
            {!selectedCommuneName && (
              <Ionicons name="checkmark" size={18} color="#16a34a" />
            )}
          </TouchableOpacity>

          {/* Lista */}
          {loading ? (
            <View className="flex-1 items-center justify-center gap-3">
              <ActivityIndicator size="large" color="#16a34a" />
              <Text className="text-sm text-gray-400">Cargando comunas...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-4xl mb-4">📍</Text>
              <Text className="text-base font-semibold text-gray-600 dark:text-gray-300 text-center">
                Sin resultados para "{query}"
              </Text>
              <Text className="text-sm text-gray-400 mt-1 text-center">
                Intenta con otro nombre de comuna o región
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.key === useLocationStore.getState().selectedCommune;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                    className="flex-row items-center px-4 py-3.5 border-b border-gray-50 dark:border-gray-800"
                  >
                    <View className="flex-1">
                      <Text className={`text-sm font-medium ${isSelected ? "text-green-700 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
                        {item.nombre}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{item.region}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}
