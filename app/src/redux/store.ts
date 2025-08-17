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
  whitelist: ["user", "songPlayer"],
  blacklist: ["playlist"],
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
