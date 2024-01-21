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
    storeNodeUrl: (state, action) => {
      state.nodeUrl = action.payload;
    },
    storeChainIdentifier: (state, action) => {
      state.chainIdentifier = action.payload;
      Zenon.setChainIdentifier(action.payload);
    },
    storeMomentumHeight: (state, action) => {
      state.momentumHeight = action.payload;
    },
  },
});

export const { resetInternalNetworkConnectionState, storeNodeUrl, storeChainIdentifier, storeMomentumHeight } =
  connectionSlice.actions;

export default connectionSlice.reducer;
