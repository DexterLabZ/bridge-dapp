import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  referralCode: "",
};

export const referralSlice = createSlice({
  name: "referral",
  initialState,
  reducers: {
    resetReferralState: (state) => {
      state = initialState;
      return state;
    },
    storeReferralCode: (state, action) => {
      state.referralCode = action.payload;
    },
  },
});

export const { resetReferralState, storeReferralCode } = referralSlice.actions;

export default referralSlice.reducer;
