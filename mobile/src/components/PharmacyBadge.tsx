import { View, Text } from "react-native";
import type { PharmacySlug } from "@/lib/types";
import { PHARMACIES } from "@/constants/pharmacies";

interface PharmacyBadgeProps {
  slug: PharmacySlug;
}

export function PharmacyBadge({ slug }: PharmacyBadgeProps) {
  const config = PHARMACIES[slug];
  if (!config) return null;
  return (
    <View
      style={{ backgroundColor: config.bgLight, borderColor: config.color }}
      className="rounded-full px-3 py-0.5 border self-start"
    >
      <Text style={{ color: config.color }} className="text-xs font-bold">
        {config.name}
      </Text>
    </View>
  );
}
