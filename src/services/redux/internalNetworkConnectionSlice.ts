import { createSlice } from "@reduxjs/toolkit";
import { Zenon } from "znn-ts-sdk";

const initialState = {
  nodeUrl: "",
  chainIdentifier: "",
  momentumHeight: "",
};

export const connectionSlice = createSlice({
  name: "internalNetworkConnection",
  initialState,
  reducers: {
    resetInternalNetworkConnectionState: (state) => {
      state = initialState;
      return state;
    },
    storeInternalNetworkNodeUrl: (state, action) => {
      state.nodeUrl = action.payload;
    },
    storeInternalNetworkChainIdentifier: (state, action) => {
      state.chainIdentifier = action.payload;
      Zenon.setChainIdentifier(action.payload);
    },
    storeMomentumHeight: (state, action) => {
      state.momentumHeight = action.payload;
    },
  },
});

export const {
  resetInternalNetworkConnectionState,
  storeInternalNetworkNodeUrl,
  storeInternalNetworkChainIdentifier,
  storeMomentumHeight,
} = connectionSlice.actions;

export default connectionSlice.reducer;
