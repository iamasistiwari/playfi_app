import { RootState } from "@/redux/store";
import { AudioPlayer, useAudioPlayer } from "expo-audio";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";

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

  const { currentSong } = useSelector((state: RootState) => state.songPlayer);
  const player = useAudioPlayer(currentSong?.musicUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerState, setPlayerState] = useState({
    position: 0,
    duration: 0,
    isBuffering: false,
  });

  useEffect(() => {
    const listener = player?.addListener("playbackStatusUpdate", (status) => {
      setPlayerState({
        position: status.currentTime,
        duration: status.duration,
        isBuffering: status.isBuffering,
      });
    });
    return () => {
      listener?.remove();
    };
  }, [player]);

  const seekTo = (value: number) => {
    player?.seekTo(value);
  };

  useEffect(() => {
    if (currentSong?.musicUrl && firstMount.current) {
      player.play();
      player.seekTo(0.5);
      setIsPlaying(true);
    } else {
      firstMount.current = true;
    }
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
