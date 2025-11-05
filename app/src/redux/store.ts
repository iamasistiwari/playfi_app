import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import userSlice from "./user-slice";
import playlistReducer from "./playlist-slice";
import songPlayerSlice from "./song-player";
import { enableMapSet } from "immer";

enableMapSet();

const rootReducer = combineReducers({
  user: userSlice,
  songPlayer: songPlayerSlice,
  playlist: playlistReducer,
});

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["user", "songPlayer", "playlist"],
  version: 3,
  migrate: (state: any) => {
    // Ensure new properties exist in persisted state
    if (state && state.songPlayer) {
      const downloadedSongsMap = state.songPlayer.downloadedSongsMap || {};
      const downloadedSongs = state.songPlayer.downloadedSongs || [];

      // Clean up duplicates in downloadedSongs array
      const uniqueDownloadedSongs = downloadedSongs.filter(
        (song: any, index: number, self: any[]) =>
          index === self.findIndex((s: any) => s.id === song.id)
      );

      // Clean up downloadedSongsMap - remove entries without valid fileUri
      const cleanedMap: Record<string, any> = {};
      Object.keys(downloadedSongsMap).forEach((key) => {
        const entry = downloadedSongsMap[key];
        if (entry && entry.fileUri && entry.video) {
          cleanedMap[key] = entry;
        }
      });

      return Promise.resolve({
        ...state,
        songPlayer: {
          ...state.songPlayer,
          downloadedSongsMap: cleanedMap,
          downloadedSongs: uniqueDownloadedSongs,
          downloadProgress: {},
          activeDownloads: [],
          lastSearchQuery: state.songPlayer.lastSearchQuery || "",
          lastSearchResults: state.songPlayer.lastSearchResults || [],
        },
      });
    }
    return Promise.resolve(state);
  },
  // blacklist: ["playlist"],
};
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

const persistor = persistStore(store);
export { persistor, store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
