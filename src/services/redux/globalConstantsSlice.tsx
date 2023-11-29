import { createSlice } from "@reduxjs/toolkit";
import constants from "../../utils/constants";

const initialState = { ...constants };

export const globalConstantsSlice = createSlice({
  name: "globalConstants",
  initialState,
  reducers: {
    resetGlobalConstantsState: (state) => {
      state = { ...initialState };
      return state;
    },
    storeGlobalConstants: (state, action) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const { resetGlobalConstantsState, storeGlobalConstants } = globalConstantsSlice.actions;

export default globalConstantsSlice.reducer;
