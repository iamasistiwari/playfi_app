import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SectionHeaderProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onSeeAll?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  iconColor = "#1DB954",
  onSeeAll,
  actionIcon,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {icon && <Ionicons name={icon} size={20} color={iconColor} />}
        <Text style={styles.title}>{title}</Text>
        {actionIcon && onAction && (
          <Pressable onPress={onAction} hitSlop={8} style={styles.actionBtn}>
            <Ionicons name={actionIcon} size={22} color="#1DB954" />
          </Pressable>
        )}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },
  actionBtn: {
    marginLeft: 4,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1DB954",
  },
});

export default SectionHeader;
