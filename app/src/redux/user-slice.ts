import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  isAdmin: boolean;
  token: string | null;
  email: string | null;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  audioQuality: string;
  crossfadeEnabled: boolean;
}

const initialState: UserState = {
  isAdmin: false,
  token: null,
  email: null,
  name: null,
  bio: null,
  avatar_url: null,
  audioQuality: "Very High (320kbps)",
  crossfadeEnabled: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.token = action.payload.token;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.isAdmin = action.payload.isAdmin;
      state.bio = action.payload.bio ?? state.bio;
      state.avatar_url = action.payload.avatar_url ?? state.avatar_url;
    },
    logout: (state) => {
      state.token = null;
      state.email = null;
      state.name = null;
      state.isAdmin = false;
      state.bio = null;
      state.avatar_url = null;
    },
    updateProfile: (
      state,
      action: PayloadAction<{ name?: string; bio?: string; avatar_url?: string }>
    ) => {
      if (action.payload.name !== undefined) state.name = action.payload.name;
      if (action.payload.bio !== undefined) state.bio = action.payload.bio;
      if (action.payload.avatar_url !== undefined)
        state.avatar_url = action.payload.avatar_url;
    },
    setAudioQuality: (state, action: PayloadAction<string>) => {
      state.audioQuality = action.payload;
    },
    setCrossfadeEnabled: (state, action: PayloadAction<boolean>) => {
      state.crossfadeEnabled = action.payload;
    },
  },
});

export const { setUser, logout, updateProfile, setAudioQuality, setCrossfadeEnabled } = userSlice.actions;
export default userSlice.reducer;
