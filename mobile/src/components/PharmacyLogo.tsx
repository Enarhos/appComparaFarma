import { View, Text } from "react-native";
import type { PharmacySlug } from "@/lib/types";
import { PHARMACIES } from "@/constants/pharmacies";

const ABBR: Record<PharmacySlug, string> = {
  "cruz-verde": "CV",
  salcobrand: "Sb",
  ahumada: "FA",
  "dr-simi": "DS",
  araucomed: "AM",
  ecofarmacias: "EF",
  farmex: "Fx",
  sermecoop: "SC",
  easyfarma: "Ez",
};

interface Props {
  slug: PharmacySlug;
  size?: number;
}

export function PharmacyLogo({ slug, size = 48 }: Props) {
  const config = PHARMACIES[slug];
  const abbr = ABBR[slug] ?? "?";
  const fontSize = size * 0.33;
  const radius = size * 0.22;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: config?.color ?? "#9ca3af",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "800",
          fontSize,
          letterSpacing: -0.5,
        }}
      >
        {abbr}
      </Text>
    </View>
  );
}
