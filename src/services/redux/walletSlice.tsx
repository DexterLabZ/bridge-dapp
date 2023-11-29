import {createSlice} from "@reduxjs/toolkit";

const initialState = {
  zenonInfo: "",
  ercInfo: "",
};

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    resetWalletState: (state) => {
      state = initialState;
      return state;
    },
    resetZenonInfo: (state) => {
      state.zenonInfo = initialState.zenonInfo;
      return state;
    },
    resetErcInfo: (state) => {
      state.ercInfo = initialState.ercInfo;
      return state;
    },
    storeZenonInfo: (state, action) => {
      if (typeof action.payload == "string") {
        state.zenonInfo = action.payload;
      } else {
        state.zenonInfo = JSON.stringify(action.payload);
      }
      return state;
    },
    storeErcInfo: (state, action) => {
      if (typeof action.payload == "string") {
        state.ercInfo = action.payload;
      } else {
        state.ercInfo = JSON.stringify(action.payload);
      }
      return state;
    },
  },
});

export const {resetWalletState, resetZenonInfo, resetErcInfo, storeZenonInfo, storeErcInfo} = walletSlice.actions;

export default walletSlice.reducer;
