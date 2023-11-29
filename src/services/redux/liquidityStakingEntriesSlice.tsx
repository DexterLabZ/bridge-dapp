import { createSlice } from "@reduxjs/toolkit";

type liquidityStakingState = {
  emptyStakingEntry: string | undefined;
  activeStakingEntry: string | undefined;
  allStakingEntries: string;
  successInfo: string;
};

const initialState: liquidityStakingState = {
  emptyStakingEntry: undefined,
  activeStakingEntry: undefined,
  allStakingEntries: "",
  successInfo: "",
};

export const liquidityStakingEntriesSlice = createSlice({
  name: "liquidityStakingEntries",
  initialState,
  reducers: {
    resetWalletState: (state) => {
      state = initialState;
      return state;
    },
    storeActiveStakingEntry: (state, action) => {
      state.activeStakingEntry = action.payload;
      console.log("store/storeActiveStakingEntry - action.payload", action.payload);
      console.log("store/storeActiveStakingEntry - state", state);

      return state;
    },
    clearActiveStakingEntry: (state) => {
      state.activeStakingEntry = initialState.activeStakingEntry;
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
    storeAllStakingEntries: (state, action) => {
      state.allStakingEntries = action.payload;
      localStorage.setItem("stakingEntries", state.allStakingEntries);
      return state;
    },
  },
});

export const {
  resetWalletState,
  storeActiveStakingEntry,
  clearActiveStakingEntry,
  storeSuccessInfo,
  clearSuccessInfo,
  storeAllStakingEntries,
} = liquidityStakingEntriesSlice.actions;

export default liquidityStakingEntriesSlice.reducer;
