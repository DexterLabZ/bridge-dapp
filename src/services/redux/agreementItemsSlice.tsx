import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  checkboxItems: [
    {
      label: "I understand all the risks involved with cryptocurrency and I did my due diligence.",
      status: 0,
    },
    {
      label: "I understand this is an experimental tool and it comes as is, with no guarantees.",
      status: 0,
    },
    {
      label: "I will not use this tool for any illegal activity.",
      status: 0,
    },
    {
      label:
        "I am not an entity or citizen of the US nor any OFAC sanctioned country, nor am I at the moment living nor visiting any of the OFAC sanctioned countries.",
      status: 0,
    },
    {
      label: "I will not send funds from a custodial wallet nor attempt to send them directly to the contract.",
      status: 0,
    },
    {
      label: "I understand using this tool can result in permanent loss of funds.",
      status: 0,
    },
  ],
};

export const agreementItemsSlice = createSlice({
  name: "agreementItems",
  initialState,
  reducers: {
    resetAgreementItemsState: (state) => {
      state = initialState;
      return state;
    },
    storeAgreementItems: (state, action) => {
      state.checkboxItems = [...action.payload];
      return state;
    },
  },
});

export const { resetAgreementItemsState, storeAgreementItems } = agreementItemsSlice.actions;

export default agreementItemsSlice.reducer;
