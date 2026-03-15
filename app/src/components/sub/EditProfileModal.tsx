import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { updateUserProfile } from "@/actions/user";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { updateProfile } from "@/redux/user-slice";

const AVATAR_GRADIENTS = [
  ["#1DB954", "#169041"],
  ["#6C5CE7", "#4834D4"],
  ["#FF6B6B", "#EE5A24"],
  ["#00B894", "#00CEC9"],
  ["#FD79A8", "#E84393"],
  ["#74B9FF", "#0984E3"],
  ["#FDCB6E", "#F39C12"],
  ["#636E72", "#2D3436"],
];

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const { name, bio, avatar_url } = useSelector(
    (state: RootState) => state.user
  );
  const dispatch = useDispatch<AppDispatch>();

  const [editName, setEditName] = useState(name || "");
  const [editBio, setEditBio] = useState(bio || "");
  const [selectedGradient, setSelectedGradient] = useState(
    avatar_url ? parseInt(avatar_url) || 0 : 0
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) {
      Toast.show({ type: "error", text1: "Name is required" });
      return;
    }
    setSaving(true);
    const result = await updateUserProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      avatar_url: String(selectedGradient),
    });
    setSaving(false);

    if (result) {
      dispatch(
        updateProfile({
          name: editName.trim(),
          bio: editBio.trim(),
          avatar_url: String(selectedGradient),
        })
      );
      onSaved?.();
      onClose();
    } else {
      Toast.show({ type: "error", text1: "Failed to update profile" });
    }
  };

  const initials = (editName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <LinearGradient
            colors={["#1a1a1a", "#0a0a0a"]}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Pressable onPress={handleSave} disabled={saving}>
                <Text
                  style={[styles.saveText, saving && styles.saveTextDisabled]}
                >
                  {saving ? "Saving..." : "Save"}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {/* Avatar Preview */}
              <View style={styles.avatarSection}>
                <LinearGradient
                  colors={AVATAR_GRADIENTS[selectedGradient] as [string, string]}
                  style={styles.avatarPreview}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              </View>

              {/* Avatar Color Selection */}
              <Text style={styles.label}>Avatar Color</Text>
              <View style={styles.colorsRow}>
                {AVATAR_GRADIENTS.map((colors, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setSelectedGradient(index)}
                  >
                    <LinearGradient
                      colors={colors as [string, string]}
                      style={[
                        styles.colorOption,
                        selectedGradient === index && styles.colorOptionSelected,
                      ]}
                    >
                      {selectedGradient === index && (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      )}
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>

              {/* Name Input */}
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                maxLength={50}
              />

              {/* Bio Input */}
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                maxLength={150}
              />
              <Text style={styles.charCount}>{editBio.length}/150</Text>
            </ScrollView>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  cancelText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  saveText: {
    fontSize: 16,
    color: "#1DB954",
    fontWeight: "700",
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 20,
  },
  colorsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#fff",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    textAlign: "right",
    marginTop: 6,
  },
});

export default EditProfileModal;
