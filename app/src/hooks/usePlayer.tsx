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
}

const PlayerContext = createContext<PlayerContextProps>({
  togglePlayPause: () => {},
  isPlaying: false,
  player: useAudioPlayer(),
});

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const firstMount = useRef(false);

  const { currentSong } = useSelector((state: RootState) => state.songPlayer);
  const player = useAudioPlayer(currentSong?.musicUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
