import { createSlice } from "@reduxjs/toolkit";

type wrapRequestsState = {
  emptyWrapRequest: string;
  activeWrapRequest: string;
  allWrapRequests: string;
  emptyUnwrapRequest: string;
  activeUnwrapRequest: string;
  allUnwrapRequests: string;
  successInfo: string;
};

const initialState: wrapRequestsState = {
  emptyWrapRequest: `{"id": "", "amount": 0, "timestamp": -1}`,
  activeWrapRequest: `{"id": "", "amount": 0, "timestamp": -1}`,
  allWrapRequests: "",
  emptyUnwrapRequest: `{"transactionHash": "", "amount": 0, "timestamp": -1}`,
  activeUnwrapRequest: `{"transactionHash": "", "amount": 0, "timestamp": -1}`,
  allUnwrapRequests: "",
  successInfo: "",
};

export const requestSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    resetWalletState: (state) => {
      state = initialState;
      return state;
    },
    storeActiveWrapRequest: (state, action) => {
      state.activeWrapRequest = action.payload;
      console.log("store/storeActiveWrapRequest - action.payload", action.payload);
      console.log("store/storeActiveWrapRequest - state", state);

      return state;
    },
    clearActiveWrapRequest: (state) => {
      state.activeWrapRequest = initialState.activeWrapRequest;
      return state;
    },
    storeSuccessInfo: (state, action) => {
      state.successInfo = action.payload;
      return state;
    },
    clearSuccessInfo: (state) => {
      state.successInfo = initialState.successInfo;
      return state;
    },
    storeAllWrapRequests: (state, action) => {
      state.allWrapRequests = action.payload;
      localStorage.setItem("wrapRequests", state.allWrapRequests);
      return state;
    },
    storeActiveUnwrapRequest: (state, action) => {
      state.activeUnwrapRequest = action.payload;
      console.log("store/storeActiveUnwrapRequest - action.payload", action.payload);
      console.log("store/storeActiveUnwrapRequest - state", state);

      return state;
    },
    clearActiveUnwrapRequest: (state) => {
      state.activeUnwrapRequest = initialState.activeUnwrapRequest;
      return state;
    },
  },
});

export const {
  resetWalletState,
  storeActiveWrapRequest,
  clearActiveWrapRequest,
  storeSuccessInfo,
  clearSuccessInfo,
  storeAllWrapRequests,
  storeActiveUnwrapRequest,
  clearActiveUnwrapRequest,
} = requestSlice.actions;

export default requestSlice.reducer;
