import { AppDispatch, RootState } from "@/redux/store";
import { playNextAsync, playPreviousAsync } from "@/redux/thunks/songThunk";
import { recordPlay } from "@/actions/songs";
import { Video } from "@/types/song";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AudioPro,
  AudioProContentType,
  AudioProEventType,
  AudioProState,
} from "react-native-audio-pro";

interface PlayerContextProps {
  togglePlayPause: () => void;
  playerState: {
    position: number;
    duration: number;
    isBuffering: boolean;
    isPlaying: boolean;
  };
  seekTo: (value: number) => void;
}

const PlayerContext = createContext<PlayerContextProps>({
  togglePlayPause: () => {},
  playerState: {
    position: 0,
    duration: 0,
    isBuffering: false,
    isPlaying: false,
  },
  seekTo: () => {},
});

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentSong, queue } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const isFirstMount = useRef(true);
  const dispatch = useDispatch<AppDispatch>();
  const [playerState, setPlayerState] = useState({
    position: 0,
    duration: 0,
    isBuffering: false,
    isPlaying: false,
  });

  // Play tracking refs
  const playStartTime = useRef<number>(0);
  const currentSongRef = useRef<string | null>(null);
  const currentVideoRef = useRef<Video | null>(null);
  const lastDuration = useRef<number>(0);
  const lastPosition = useRef<number>(0);
  const hasTriggeredAutoNext = useRef(false);

  const sendPlayRecord = () => {
    const songId = currentSongRef.current;
    if (!songId || playStartTime.current === 0) return;

    const durationListened = Math.floor(
      (Date.now() - playStartTime.current) / 1000
    );
    const totalDuration = lastDuration.current / 1000; // ms to s
    const completed = totalDuration > 0 && durationListened / totalDuration > 0.8;

    if (durationListened > 5) {
      recordPlay(songId, durationListened, completed, currentVideoRef.current || undefined).catch(() => {});
    }

    playStartTime.current = 0;
  };

  // setup the player on mount
  useEffect(() => {
    AudioPro.configure({
      contentType: AudioProContentType.MUSIC,
      showNextPrevControls: true,
      showSkipControls: false,
      skipIntervalMs: 10000,
    });
  }, []);

  // subscribing for events
  useEffect(() => {
    const subscription = AudioPro.addEventListener((event) => {
      switch (event.type) {
        case AudioProEventType.REMOTE_NEXT:
          dispatch(playNextAsync());
          break;

        case AudioProEventType.REMOTE_PREV:
          dispatch(playPreviousAsync());
          break;

        case AudioProEventType.STATE_CHANGED:
          setPlayerState((prev) => ({
            ...prev,
            isBuffering: event?.payload?.state === AudioProState.LOADING,
            isPlaying: event?.payload?.state === AudioProState.PLAYING,
          }));
          break;

        case AudioProEventType.PROGRESS:
          lastPosition.current = event?.payload?.position || 0;
          lastDuration.current = event?.payload?.duration || 0;
          setPlayerState((prev) => ({
            ...prev,
            position: event?.payload?.position || prev.position,
            duration: event?.payload?.duration || prev.duration,
          }));
          if (
            event?.payload?.duration > 0 &&
            event?.payload?.duration - event?.payload?.position < 4000 &&
            !hasTriggeredAutoNext.current
          ) {
            hasTriggeredAutoNext.current = true;
            dispatch(playNextAsync());
          }
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const seekTo = (value: number) => {
    if (AudioPro) {
      AudioPro.seekTo(value);
    }
  };

  useEffect(() => {
    const prepareAudio = async () => {
      // Record play for previous song before switching
      sendPlayRecord();

      // Reset auto-next guard for new song
      hasTriggeredAutoNext.current = false;

      if ((currentSong?.musicUrl?.length || 0) > 0) {
        // Start tracking new song
        currentSongRef.current = currentSong?.video?.id || null;
        currentVideoRef.current = currentSong?.video || null;
        playStartTime.current = Date.now();

        const trackToPlay = {
          id: currentSong?.video?.id || "",
          url: currentSong?.musicUrl || "",
          title: currentSong?.video?.title || "",
          artwork: currentSong?.video?.richThumbnail?.url || "",
          artist: currentSong?.video?.channel?.name || "",
        };
        if (!isFirstMount.current) {
          AudioPro.play(trackToPlay);
          setPlayerState((prev) => ({
            ...prev,
            position: 0,
          }));
        } else {
          AudioPro.play(trackToPlay, { autoPlay: false });
          isFirstMount.current = false;
        }
      }
    };
    prepareAudio();
  }, [currentSong]);

  // Record play on unmount
  useEffect(() => {
    return () => {
      sendPlayRecord();
    };
  }, []);

  const togglePlayPause = () => {
    const state = AudioPro.getState();
    if (state === AudioProState.PLAYING) {
      AudioPro.pause();
    }
    if (state === AudioProState.IDLE) {
      const trackToPlay = {
        id: currentSong?.video?.id || "",
        url: currentSong?.musicUrl || "",
        title: currentSong?.video?.title || "",
        artwork: currentSong?.video?.richThumbnail?.url || "",
        artist: currentSong?.video?.channel?.name || "",
      };
      AudioPro.play(trackToPlay);
    }
    if (state === AudioProState.PAUSED) {
      AudioPro.resume();
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        togglePlayPause,
        playerState,
        seekTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
