import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    View,
    TouchableOpacity,
    Text as RNText,
    StyleSheet,
} from "react-native";
import { Audio } from "expo-av";
import Icon from "@expo/vector-icons/FontAwesome";
import { MaterialIcons } from "@expo/vector-icons";

// Define your playlist
const PLAYLIST = [
    {
        uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        title: "Song 1",
        artwork: "https://i.imgur.com/TKyCtYD.png",
    },
    {
        uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        title: "Song 2",
        artwork: "https://i.imgur.com/TKyCtYD.png",
    },
    {
        uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        title: "Song 3",
        artwork: "https://i.imgur.com/TKyCtYD.png",
    },
];

const PRIMARY_COLOR = "#3366FF";

export default function TestAudioPlayerAV() {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const soundRef = useRef(null);

    // Configure audio mode
    useEffect(() => {
        Audio.setAudioModeAsync({
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
        }).catch(console.error);
    }, []);

    // Load and play track
    const loadTrack = async (index) => {
        try {
            // Unload previous sound
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: PLAYLIST[index].uri },
                {
                    shouldPlay: isPlaying,
                    progressUpdateIntervalMillis: 500,
                },
                onPlaybackStatusUpdate
            );

            soundRef.current = sound;

        } catch (error) {
            console.error("Error loading track:", error);
        }
    };

    // Playback status callback
    const onPlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
            setIsPlaying(status.isPlaying);

            // Auto-play next track when current finishes
            if (status.didJustFinish && !status.isLooping) {
                playNext();
            }
        }
    };

    // Load track when index changes
    useEffect(() => {
        loadTrack(currentTrackIndex);

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, [currentTrackIndex]);

    // Playback controls
    const togglePlayback = async () => {
        if (!soundRef.current) return;
        try {
            if (isPlaying) {
                await soundRef.current.pauseAsync();
            } else {
                await soundRef.current.playAsync();
            }
        } catch (err) {
            console.error("Playback error:", err);
        }
    };

    const playNext = async () => {
        const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
        setCurrentTrackIndex(nextIndex);
    };

    const playPrevious = async () => {
        const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
        setCurrentTrackIndex(prevIndex);
    };

    const restart = async () => {
        if (soundRef.current) {
            try {
                await soundRef.current.setPositionAsync(0);
                await soundRef.current.playAsync();
            } catch (err) {
                console.error("Restart error:", err);
            }
        }
    };

    const skipForward = async () => {
        if (!soundRef.current) return;
        try {
            const newPosition = Math.min(position + 10000, duration);
            await soundRef.current.setPositionAsync(newPosition);
        } catch (err) {
            console.error("Skip forward error:", err);
        }
    };

    const skipBackward = async () => {
        if (!soundRef.current) return;
        try {
            const newPosition = Math.max(position - 10000, 0);
            await soundRef.current.setPositionAsync(newPosition);
        } catch (err) {
            console.error("Skip backward error:", err);
        }
    };

    const formatTime = (millis) => {
        if (!millis || millis < 0) return "00:00";
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    };

    const progress = duration > 0 ? position / duration : 0;

    return (
        <View style={styles.container}>
            {/* Audio title */}
            <View style={styles.titleContainer}>
                <RNText style={styles.title}>
                    {PLAYLIST[currentTrackIndex].title}
                </RNText>
                <RNText style={styles.trackInfo}>
                    Track {currentTrackIndex + 1} of {PLAYLIST.length}
                </RNText>
            </View>

            {/* Progress bar */}
            <View style={styles.progressSection}>
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${progress * 100}%`,
                                    backgroundColor: PRIMARY_COLOR,
                                },
                            ]}
                        />
                        <View
                            style={[
                                styles.progressThumb,
                                {
                                    left: `${progress * 100}%`,
                                    backgroundColor: PRIMARY_COLOR,
                                },
                            ]}
                        />
                    </View>
                </View>
                <View style={styles.timeContainer}>
                    <RNText style={styles.timeText}>{formatTime(position)}</RNText>
                    <RNText style={styles.timeText}>{formatTime(duration)}</RNText>
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.circleButton} onPress={restart}>
                    <Icon name="refresh" size={18} color={PRIMARY_COLOR} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={playPrevious}>
                    <MaterialIcons
                        name="skip-previous"
                        size={32}
                        color={PRIMARY_COLOR}
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={skipBackward}>
                    <MaterialIcons
                        name="replay-10"
                        size={28}
                        color={PRIMARY_COLOR}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.playButton,
                        { backgroundColor: PRIMARY_COLOR },
                    ]}
                    onPress={togglePlayback}
                >
                    <Icon
                        name={isPlaying ? "pause" : "play"}
                        size={24}
                        color="white"
                        style={isPlaying ? styles.pauseIcon : styles.playIcon}
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={skipForward}>
                    <MaterialIcons
                        name="forward-10"
                        size={28}
                        color={PRIMARY_COLOR}
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={playNext}>
                    <MaterialIcons
                        name="skip-next"
                        size={32}
                        color={PRIMARY_COLOR}
                    />
                </TouchableOpacity>
            </View>

            {/* Important Note */}
            <View style={styles.noteContainer}>
                <RNText style={styles.noteText}>
                    Note: expo-av has limited lock screen control support.{'\n'}
                    For full lock screen next/previous controls, use:{'\n'}
                    • react-native-track-player (recommended){'\n'}
                    • expo-av with expo-media-library for metadata{'\n'}
                    • Custom native modules
                </RNText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingVertical: 24,
        width: "100%",
    },
    titleContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
    },
    trackInfo: {
        fontSize: 12,
        color: "#777777",
    },
    controls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    circleButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 8,
    },
    skipButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 8,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 12,
    },
    progressSection: {
        width: "100%",
        marginBottom: 24,
    },
    progressBarContainer: {
        width: "100%",
        height: 20,
        justifyContent: "center",
    },
    progressTrack: {
        width: "100%",
        height: 4,
        backgroundColor: "#E5E5E5",
        borderRadius: 2,
        position: "relative",
    },
    progressFill: {
        height: "100%",
        borderRadius: 2,
        position: "absolute",
    },
    progressThumb: {
        position: "absolute",
        width: 16,
        height: 16,
        borderRadius: 8,
        top: -6,
        marginLeft: -8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    timeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
        width: "100%",
    },
    timeText: {
        fontSize: 14,
        color: "#777777",
    },
    playIcon: {
        marginLeft: 4,
    },
    pauseIcon: {
        marginLeft: 0,
    },
    noteContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    noteText: {
        fontSize: 11,
        color: "#999",
        textAlign: "center",
        fontStyle: "italic",
        lineHeight: 16,
    },
});