import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  nodeUrl: "",
  networkId: "",
  chainIdentifier: "",
};

export const connectionSlice = createSlice({
  name: "externalNetworkConnection",
  initialState,
  reducers: {
    resetExternalNetworkConnectionState: (state) => {
      state = initialState;
      return state;
    },
    storeExternalNetworkNodeUrl: (state, action) => {
      state.nodeUrl = action.payload;
    },
    storeExternalNetworkChainIdentifier: (state, action) => {
      state.chainIdentifier = action.payload;
    },
    storeExternalNetworkId: (state, action) => {
      state.networkId = action.payload;
    },
  },
});

export const {
  resetExternalNetworkConnectionState,
  storeExternalNetworkNodeUrl,
  storeExternalNetworkChainIdentifier,
  storeExternalNetworkId,
} = connectionSlice.actions;

export default connectionSlice.reducer;
