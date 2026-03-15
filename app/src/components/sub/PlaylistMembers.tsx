import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlaylistMember } from "@/types/song";

interface PlaylistMembersProps {
  members: PlaylistMember[];
  isAdmin: boolean;
  onRemove?: (email: string) => void;
}

const PlaylistMembers: React.FC<PlaylistMembersProps> = ({
  members,
  isAdmin,
  onRemove,
}) => {
  if (!members || members.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Members</Text>
      <View style={styles.avatarRow}>
        {members.slice(0, 5).map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.memberName}>
              {member.user.name.split(" ")[0]}
            </Text>
            <Text style={styles.roleBadge}>
              {member.role}
            </Text>
            {isAdmin && onRemove && (
              <Pressable
                style={styles.removeBtn}
                onPress={() => onRemove(member.user.email)}
              >
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
              </Pressable>
            )}
          </View>
        ))}
        {members.length > 5 && (
          <View style={styles.memberItem}>
            <View style={[styles.avatar, styles.moreAvatar]}>
              <Text style={styles.avatarText}>+{members.length - 5}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: "row",
    gap: 16,
  },
  memberItem: {
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  moreAvatar: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  memberName: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    maxWidth: 50,
    textAlign: "center",
  },
  roleBadge: {
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  removeBtn: {
    position: "absolute",
    top: -2,
    right: -2,
  },
});

export default PlaylistMembers;
