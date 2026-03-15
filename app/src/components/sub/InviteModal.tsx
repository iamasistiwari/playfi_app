import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { inviteToPlaylist, searchUsers } from "@/actions/playlist";
import Toast from "react-native-toast-message";
import { UserSearchResult } from "@/types/song";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  playlistId: string;
  onInvited?: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({
  visible,
  onClose,
  playlistId,
  onInvited,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setSelectedUser(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const users = await searchUsers(text.trim());
      setResults(users);
      setSearching(false);
    }, 300);
  }, []);

  const handleInvite = async (email: string) => {
    setInviting(true);
    const result = await inviteToPlaylist(playlistId, email, role);
    setInviting(false);

    if (result.status) {
      Toast.show({ type: "success", text1: result.message });
      resetState();
      onInvited?.();
      onClose();
    } else {
      Toast.show({ type: "error", text1: result.message });
    }
  };

  const resetState = () => {
    setQuery("");
    setResults([]);
    setSelectedUser(null);
    setRole("editor");
    setFallbackEmail("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => (
    <Pressable
      style={[
        styles.userRow,
        selectedUser?.email === item.email && styles.userRowSelected,
      ]}
      onPress={() => setSelectedUser(item)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      {selectedUser?.email === item.email ? (
        <Ionicons name="checkmark-circle" size={22} color="#1DB954" />
      ) : (
        <Ionicons name="person-add-outline" size={20} color="rgba(255,255,255,0.4)" />
      )}
    </Pressable>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Invite to Playlist</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Search Input */}
          <Text style={styles.label}>Search Users</Text>
          <TextInput
            style={styles.input}
            placeholder="Search by name or email..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Search Results */}
          {searching && (
            <ActivityIndicator color="#1DB954" style={{ marginBottom: 12 }} />
          )}

          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.email}
              renderItem={renderUserItem}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {query.length >= 2 && !searching && results.length === 0 && (
            <Text style={styles.noResults}>No users found</Text>
          )}

          {/* Role Picker */}
          {selectedUser && (
            <View style={styles.roleSection}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow}>
                <Pressable
                  style={[styles.roleChip, role === "editor" && styles.roleChipActive]}
                  onPress={() => setRole("editor")}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      role === "editor" && styles.roleChipTextActive,
                    ]}
                  >
                    Editor
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.roleChip, role === "viewer" && styles.roleChipActive]}
                  onPress={() => setRole("viewer")}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      role === "viewer" && styles.roleChipTextActive,
                    ]}
                  >
                    Viewer
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Send Invite Button (for selected user) */}
          {selectedUser && (
            <Pressable
              style={[styles.button, inviting && styles.buttonDisabled]}
              onPress={() => handleInvite(selectedUser.email)}
              disabled={inviting}
            >
              {inviting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#000" />
                  <Text style={styles.buttonText}>
                    Invite {selectedUser.name.split(" ")[0]}
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {/* Fallback: Invite by email */}
          <View style={styles.fallbackSection}>
            <Text style={styles.fallbackTitle}>Or invite by email</Text>
            <View style={styles.fallbackRow}>
              <TextInput
                style={[styles.input, styles.fallbackInput]}
                placeholder="user@example.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={fallbackEmail}
                onChangeText={setFallbackEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[
                  styles.fallbackBtn,
                  (!fallbackEmail.trim() || inviting) && styles.buttonDisabled,
                ]}
                onPress={() => handleInvite(fallbackEmail.trim())}
                disabled={!fallbackEmail.trim() || inviting}
              >
                {inviting ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons name="send" size={18} color="#000" />
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.7,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  resultsList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  userRowSelected: {
    backgroundColor: "rgba(29,185,84,0.12)",
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  userEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 1,
  },
  noResults: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    marginBottom: 12,
  },
  roleSection: {
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleChipActive: {
    backgroundColor: "#1DB954",
    borderColor: "#1DB954",
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  roleChipTextActive: {
    color: "#000",
  },
  button: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  fallbackSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 14,
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 10,
  },
  fallbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fallbackInput: {
    flex: 1,
    marginBottom: 0,
  },
  fallbackBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default InviteModal;
