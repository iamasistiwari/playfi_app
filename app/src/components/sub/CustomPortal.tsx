import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

interface BaseProps {
  dialogTitle: string;
  dialogContent?: React.ReactNode;
  onSubmit?: (inputValue?: string) => Promise<void>;
  actionTitle?: string;
  actionClassName?: string;
  autoClose?: boolean;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
}

interface WithTrigger extends BaseProps {
  triggerTitle: string;
  visible?: never;
  handleClose?: never;
}

interface Controlled extends BaseProps {
  triggerTitle?: undefined;
  visible: boolean;
  handleClose: () => void;
}

type Props = WithTrigger | Controlled;

const CustomPortal = ({
  triggerTitle,
  dialogTitle,
  dialogContent,
  visible,
  handleClose,
  onSubmit,
  actionTitle = "Done",
  autoClose = true,
  actionClassName,
  inputPlaceholder,
  inputDefaultValue,
}: Props) => {
  const [portalVisible, setPortalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(inputDefaultValue || "");

  const isVisible = triggerTitle ? portalVisible : visible;
  const hasInput = !!inputPlaceholder;
  const isDestructive = actionClassName?.includes("red");

  useEffect(() => {
    if (isVisible && inputDefaultValue !== undefined) {
      setInputValue(inputDefaultValue);
    }
  }, [isVisible, inputDefaultValue]);

  const handlePortalClose = () => {
    if (triggerTitle) {
      setPortalVisible(false);
    } else if (handleClose) {
      handleClose();
    }
  };

  return (
    <View>
      {triggerTitle && (
        <Pressable
          style={styles.trigger}
          onPress={() => setPortalVisible(true)}
        >
          <Text style={styles.triggerText}>{triggerTitle}</Text>
        </Pressable>
      )}

      <Modal
        transparent
        visible={isVisible}
        animationType="fade"
        onRequestClose={handlePortalClose}
      >
        <Pressable style={styles.backdrop} onPress={handlePortalClose}>
          <Pressable
            style={styles.container}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{dialogTitle}</Text>
              <Pressable onPress={handlePortalClose} hitSlop={8}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            {/* Content */}
            {dialogContent && <View style={styles.content}>{dialogContent}</View>}

            {/* Optional Input */}
            {hasInput && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={inputPlaceholder}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={inputValue}
                  onChangeText={setInputValue}
                  autoFocus
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={handlePortalClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  isDestructive && styles.actionButtonDestructive,
                  loading && styles.actionButtonDisabled,
                ]}
                disabled={loading}
                onPress={async () => {
                  setLoading(true);
                  await onSubmit?.(hasInput ? inputValue : undefined);
                  setLoading(false);
                  if (autoClose) {
                    handlePortalClose();
                  }
                }}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={isDestructive ? "#fff" : "#000"}
                  />
                ) : (
                  <Text
                    style={[
                      styles.actionText,
                      isDestructive && styles.actionTextDestructive,
                    ]}
                  >
                    {actionTitle}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
  },
  triggerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#1DB954",
    minWidth: 80,
    alignItems: "center",
  },
  actionButtonDestructive: {
    backgroundColor: "#dc2626",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  actionTextDestructive: {
    color: "#fff",
  },
});

export default CustomPortal;
