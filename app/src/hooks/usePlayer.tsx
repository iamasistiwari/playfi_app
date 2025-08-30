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

interface PlayerContextProps {
  togglePlayPause: () => void;
  isPlaying: boolean;
  player: AudioPlayer;
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
  player: useAudioPlayer(),
  playerState: {
    position: 0,
    duration: 0,
    isBuffering: false,
  },
  seekTo: () => {},
});

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
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
  const listenerAdded = useRef(false);
  const player = useAudioPlayer(currentSong?.musicUrl);

  useEffect(() => {
    if (!player || listenerAdded.current) return;

    const listener = player?.addListener("playbackStatusUpdate", (status) => {
      setPlayerState({
        position: status.currentTime,
        duration: status.duration,
        isBuffering: status.isBuffering,
      });
      
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
      if (status.playing && !status.isBuffering && (status.duration - status.currentTime <= 2)) {
        dispatch(playNextAsync());
      }
    });
    listenerAdded.current = true;

    return () => {
      listener?.remove();
      listenerAdded.current = false;
    };
  }, [player]);

  const seekTo = (value: number) => {
    player?.seekTo(value);
  };

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  useEffect(() => {
    const prepareAudio = async () => {
      if ((currentSong?.musicUrl?.length || 0) > 0 && firstMount.current) {
        player.seekTo(0.5);
        player.play();
        setIsPlaying(true);
      } else {
        firstMount.current = true;
      }
    };
    prepareAudio();
  }, [currentSong]);

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <PlayerContext.Provider
      value={{
        togglePlayPause,
        isPlaying,
        player,
        playerState,
        seekTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
