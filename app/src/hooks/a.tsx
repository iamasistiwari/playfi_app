import { AppDispatch, RootState } from "@/redux/store";
import { playNextAsync } from "@/redux/thunks/songThunk";
import { AudioPlayer, useAudioPlayer, setAudioModeAsync } from "expo-audio";
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
  AudioProTrack,
  useAudioPro,
} from "react-native-audio-pro";

interface PlayerContextProps {
  togglePlayPause: () => void;
  isPlaying: boolean;
  state: AudioProState;
  playingTrack: AudioProTrack;
  playerState: {
    position: number;
    duration: number;
    isBuffering: boolean;
  };
  seekTo: (value: number) => void;
}

const PlayerContext = createContext<PlayerContextProps>({
  togglePlayPause: () => {},
  isPlaying: false,
  state: AudioProState.IDLE,
  playerState: {
    position: 0,
    duration: 0,
    isBuffering: false,
  },
  playingTrack: {} as AudioProTrack,
  seekTo: () => {},
});

export const ProPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const firstMount = useRef(false);
  const { currentSong, queue } = useSelector(
    (state: RootState) => state.songPlayer
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [playerState, setPlayerState] = useState({
    position: 0,
    duration: 0,
    isBuffering: false,
  });

  const [currentTrack, setCurrentTrack] = useState<{
    id: string;
    url: string;
    title: string;
    artwork: string;
    artist: string;
  }>({
    id: currentSong?.video.id || "0_9TCak--cw",
    url:
      currentSong?.musicUrl ||
      "https://pagalall.com/wp-content/uploads/all/Pal Pal Afusic (pagalall.com).mp3",
    title: currentSong?.video.title || "Pal Pal",
    artwork:
      currentSong?.video.richThumbnail.url ||
      "https://lh3.googleusercontent.com/GoaPJH-3iAmrBnIQrELduHeCjzRHy45rHb3AbNEncitKZGaZQwMkeu5sYDyvW5VgvpPZSD_VsAjmEOv9=w120-h120-l90-rj",
    artist: currentSong?.video.channel.name || "Afusic",
  });

  const { state, playingTrack } = useAudioPro();

  const seekTo = (value: number) => {
    AudioPro.seekTo(value);
  };

  useEffect(() => {
    AudioPro.configure({
      contentType: AudioProContentType.MUSIC,
      showNextPrevControls: true,
      showSkipControls: false,
      skipIntervalMs: 30000,
    });

    const subscription = AudioPro.addEventListener((event) => {
      switch (event.type) {
        case AudioProEventType.PROGRESS:
          setPlayerState((prev) => ({
            ...prev,
            position: Number(event.payload?.position || 0),
            duration: Number(event.payload?.duration || 0),
            isBuffering: event.payload?.state === AudioProState.LOADING,
          }));
          break;

        case AudioProEventType.REMOTE_NEXT:
          console.log("User pressed Next button");
          dispatch(playNextAsync()); // optional
          break;

        case AudioProEventType.REMOTE_PREV:
          console.log("User pressed Previous button");
          break;

        case AudioProEventType.STATE_CHANGED:
          console.log("State changed to:", event.payload?.state);
          break;
      }
    });

    // ✅ Proper cleanup
    return () => {
      subscription.remove();
    };
  }, []);


  useEffect(() => {
    if (currentSong?.musicUrl?.length || 0 > 0) {
      setCurrentTrack({
        id: currentSong?.video.id || "0_9TCak--cw",
        url:
          currentSong?.musicUrl ||
          "https://pagalall.com/wp-content/uploads/all/Pal Pal Afusic (pagalall.com).mp3",
        title: currentSong?.video.title || "Pal Pal",
        artwork:
          currentSong?.video.richThumbnail.url ||
          "https://lh3.googleusercontent.com/GoaPJH-3iAmrBnIQrELduHeCjzRHy45rHb3AbNEncitKZGaZQwMkeu5sYDyvW5VgvpPZSD_VsAjmEOv9=w120-h120-l90-rj",
        artist: currentSong?.video.channel.name || "Afusic",
      });
    }
  }, [currentSong]);

  useEffect(() => {
    const prepareAudio = async () => {
      if (firstMount.current) {
        AudioPro.play(currentTrack);
        AudioPro.seekTo(10);
      } else {
        firstMount.current = true;
      }
    };
    prepareAudio();
  }, [currentTrack]);

  const togglePlayPause = () => {
    if (isPlaying) {
      AudioPro.pause();
    } else {
      AudioPro.resume();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <PlayerContext.Provider
      value={{
        togglePlayPause,
        isPlaying,
        playerState,
        seekTo,
        state,
        playingTrack,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const useProPlayer = () => useContext(PlayerContext);
