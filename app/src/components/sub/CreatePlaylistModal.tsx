import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { createPlaylistAsync } from "@/actions/playlist";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { fetchAllPlaylistAsync } from "@/redux/thunks/playlistThunk";

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (playlistId: string) => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    const result = await createPlaylistAsync(trimmed);
    setLoading(false);

    if (result.status) {
      dispatch(fetchAllPlaylistAsync());
      setName("");
      onCreated?.("");
      onClose();
    } else {
      Toast.show({ type: "error", text1: result.message || "Failed to create playlist" });
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Playlist</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.label}>Playlist Name</Text>
          <TextInput
            style={styles.input}
            placeholder="My awesome playlist"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={name}
            onChangeText={setName}
            autoFocus
            autoCorrect={false}
          />

          <Pressable
            style={[styles.button, (!name.trim() || loading) && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="add-circle" size={18} color="#000" />
                <Text style={styles.buttonText}>Create</Text>
              </>
            )}
          </Pressable>
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
    padding: 24,
  },
  container: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
});

export default CreatePlaylistModal;
