import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  nodeUrl: "",
  chainIdentifier: "",
};

export const connectionSlice = createSlice({
  name: "externalNetworkConnection",
  initialState,
  reducers: {
    resetConnectionState: (state) => {
      state = initialState;
      return state;
    },
    storeNodeUrl: (state, action) => {
      state.nodeUrl = action.payload;
    },
    storeChainIdentifier: (state, action) => {
      state.chainIdentifier = action.payload;
    },
  },
});

export const { resetConnectionState, storeNodeUrl, storeChainIdentifier } = connectionSlice.actions;

export default connectionSlice.reducer;
