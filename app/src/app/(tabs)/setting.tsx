import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { logout, setAudioQuality, setCrossfadeEnabled } from "@/redux/user-slice";
import { resetSongPlayer, clearLastSearchState, clearRecentSearch } from "@/redux/song-player";
import { resetPlaylistAfterSignout } from "@/redux/playlist-slice";
import { resetStorage } from "@/lib/get-token";
import { useRouter } from "expo-router";
import SongPlayer from "@/components/main/SongPlayer";
import Constants from "expo-constants";
import CustomPortal from "@/components/sub/CustomPortal";
import Toast from "react-native-toast-message";

const QUALITY_OPTIONS = ["Normal (128kbps)", "High (256kbps)", "Very High (320kbps)"];

const Setting = () => {
  const { name, email, audioQuality, crossfadeEnabled } = useSelector(
    (state: RootState) => state.user
  );
  const downloadedSongsMap = useSelector(
    (state: RootState) => state.songPlayer.downloadedSongsMap || {}
  );
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [signingOut, setSigningOut] = useState(false);

  const [signOutVisible, setSignOutVisible] = useState(false);
  const [clearCacheVisible, setClearCacheVisible] = useState(false);
  const [qualityVisible, setQualityVisible] = useState(false);
  const [downloadsVisible, setDownloadsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const downloadCount = Object.keys(downloadedSongsMap).length;
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const songNames = Object.values(downloadedSongsMap)
    .slice(0, 10)
    .map((info) => `• ${info.video.title}`)
    .join("\n");

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a1a", "#121212", "#000000"]}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          {/* User Info */}
          <Pressable
            style={styles.userSection}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{name || "User"}</Text>
              <Text style={styles.userEmail}>{email || ""}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="rgba(255,255,255,0.3)"
            />
          </Pressable>

          {/* Settings Groups */}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Playback</Text>
            <SettingItem
              icon="musical-notes"
              title="Audio Quality"
              subtitle={audioQuality || "Very High (320kbps)"}
              onPress={() => setQualityVisible(true)}
            />
            <SettingItem
              icon="swap-horizontal"
              title="Crossfade"
              subtitle={crossfadeEnabled ? "3 seconds" : "Off"}
              onPress={() => dispatch(setCrossfadeEnabled(!crossfadeEnabled))}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Storage</Text>
            <SettingItem
              icon="folder"
              title="Downloads"
              subtitle={`${downloadCount} song${downloadCount !== 1 ? "s" : ""} downloaded`}
              onPress={() => setDownloadsVisible(true)}
            />
            <SettingItem
              icon="trash-outline"
              title="Clear Cache"
              subtitle="Free up storage space"
              onPress={() => setClearCacheVisible(true)}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>About</Text>
            <SettingItem
              icon="information-circle"
              title="App Version"
              subtitle={appVersion}
            />
            <SettingItem
              icon="shield-checkmark"
              title="Privacy Policy"
              subtitle=""
              onPress={() => setPrivacyVisible(true)}
            />
          </View>

          {/* Sign Out */}
          <Pressable style={styles.signOutButton} onPress={() => setSignOutVisible(true)}>
            <Ionicons name="log-out-outline" size={22} color="#ff4444" />
            <Text style={styles.signOutText}>
              {signingOut ? "Signing out..." : "Sign Out"}
            </Text>
          </Pressable>

          <Text style={styles.footer}>PlayFi v{appVersion}</Text>
        </ScrollView>
        <SongPlayer />
      </LinearGradient>

      {/* Sign Out Dialog */}
      <CustomPortal
        visible={signOutVisible}
        handleClose={() => setSignOutVisible(false)}
        dialogTitle="Sign Out"
        dialogContent={
          <Text style={styles.dialogText}>
            Are you sure you want to sign out?
          </Text>
        }
        actionTitle="Sign Out"
        actionClassName="text-red-500"
        onSubmit={async () => {
          setSigningOut(true);
          dispatch(logout());
          dispatch(resetPlaylistAfterSignout());
          dispatch(resetSongPlayer());
          await resetStorage();
          router.push("/");
          setSigningOut(false);
        }}
      />

      {/* Clear Cache Dialog */}
      <CustomPortal
        visible={clearCacheVisible}
        handleClose={() => setClearCacheVisible(false)}
        dialogTitle="Clear Cache"
        dialogContent={
          <Text style={styles.dialogText}>
            This will clear cached search results and thumbnails.
          </Text>
        }
        actionTitle="Clear"
        actionClassName="text-red-500"
        onSubmit={async () => {
          dispatch(clearLastSearchState());
          dispatch(clearRecentSearch());
          Toast.show({ type: "success", text1: "Cache cleared successfully" });
        }}
      />

      {/* Audio Quality Dialog */}
      <CustomPortal
        visible={qualityVisible}
        handleClose={() => setQualityVisible(false)}
        dialogTitle="Audio Quality"
        dialogContent={
          <View style={{ gap: 6 }}>
            <Text style={styles.dialogText}>
              Select audio quality. Actual quality depends on source availability.
            </Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {QUALITY_OPTIONS.map((option) => {
                const isSelected = option === (audioQuality || "Very High (320kbps)");
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      dispatch(setAudioQuality(option));
                      setQualityVisible(false);
                    }}
                    style={[
                      styles.qualityOption,
                      isSelected && styles.qualityOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.qualityOptionText,
                        isSelected && styles.qualityOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#1DB954" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        actionTitle="Done"
      />

      {/* Downloads Info Dialog */}
      <CustomPortal
        visible={downloadsVisible}
        handleClose={() => setDownloadsVisible(false)}
        dialogTitle="Downloads"
        dialogContent={
          <View>
            <Text style={styles.dialogText}>
              {downloadCount} song{downloadCount !== 1 ? "s" : ""} downloaded
            </Text>
            {songNames ? (
              <Text style={[styles.dialogText, { marginTop: 12, fontSize: 13 }]}>
                {songNames}
              </Text>
            ) : (
              <Text style={[styles.dialogText, { marginTop: 8 }]}>No downloads</Text>
            )}
          </View>
        }
        actionTitle="OK"
      />

      {/* Privacy Policy Dialog */}
      <CustomPortal
        visible={privacyVisible}
        handleClose={() => setPrivacyVisible(false)}
        dialogTitle="Privacy Policy"
        dialogContent={
          <Text style={styles.dialogText}>
            PlayFi respects your privacy. We collect minimal data necessary to provide
            the music streaming service. Your listening history is used to personalize
            recommendations. We do not sell your data to third parties.
          </Text>
        }
        actionTitle="OK"
      />
    </View>
  );
};

const SettingItem = ({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) => {
  const content = (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color="rgba(255,255,255,0.3)"
      />
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  group: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  settingSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,68,68,0.2)",
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ff4444",
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.2)",
    marginTop: 32,
    fontWeight: "600",
  },
  dialogText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    lineHeight: 22,
  },
  qualityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  qualityOptionSelected: {
    backgroundColor: "rgba(29,185,84,0.12)",
    borderWidth: 1,
    borderColor: "rgba(29,185,84,0.3)",
  },
  qualityOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  qualityOptionTextSelected: {
    color: "#1DB954",
  },
});

export default Setting;
