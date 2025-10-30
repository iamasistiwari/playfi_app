import { AppDispatch, RootState } from "@/redux/store";
import { playNextAsync, playPreviousAsync } from "@/redux/thunks/songThunk";
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

  // setup the player on mount
  useEffect(() => {
    AudioPro.configure({
      contentType: AudioProContentType.MUSIC,
      showNextPrevControls: true, // Hide next/previous buttons
      showSkipControls: false,
      skipIntervalMs: 10000, // Number of milliseconds for skip forward/back controls (default: 30000)
    });
  }, []);

  // subscibing for event
  useEffect(() => {
    const subscription = AudioPro.addEventListener((event) => {
      switch (event.type) {
        case AudioProEventType.REMOTE_NEXT:
          // Handle next track button press
          console.log("User pressed Next button");
          dispatch(playNextAsync());
          break;

        case AudioProEventType.REMOTE_PREV:
          // Handle previous track button press
          console.log("User pressed Previous button");
          dispatch(playPreviousAsync());
          break;

        case AudioProEventType.STATE_CHANGED:
          // Handle state changes
          // console.log("State is Changed to", event?.payload);
          setPlayerState((prev) => ({
            ...prev,
            isBuffering: event?.payload?.state === AudioProState.LOADING,
            isPlaying: event?.payload?.state === AudioProState.PLAYING,
          }));
          break;

        case AudioProEventType.PROGRESS:
          setPlayerState((prev) => ({
            ...prev,
            position: event?.payload?.position || prev.position,
            duration: event?.payload?.duration || prev.duration,
          }));
          if(event?.payload?.duration - event?.payload?.position < 4000) {
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
      if ((currentSong?.musicUrl?.length || 0) > 0) {
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
