import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  isAdmin: boolean;
  token: string | null;
  email: string | null;
  name: string | null;
}

const initialState: UserState = {
  isAdmin: false,
  token: null,
  email: null,
  name: null,
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
    },
    logout: (state) => {
      state.token = null;
      state.email = null;
      state.name = null;
      state.isAdmin = false;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
