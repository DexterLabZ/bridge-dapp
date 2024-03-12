import { createSlice } from "@reduxjs/toolkit";

export enum flowTypes {
  Swap = "swap",
  LiquidityStaking = "liquidityStaking",
}

export enum swapFlowSteps {
  Home = 0,
  Agreement = 1,
  ExtensionConnect = 2,
  Swap = 3,
  Requests = 4,
  Success = 5,
}

export enum liquidityFlowSteps {
  Home = 0,
  Agreement = 11,
  ExtensionConnect = 12,
  Overview = 13,
  AddLiquidity = 14,
  Bridge = 15,
  BridgeHistory = 16,
  Staking = 17,
  Success = 18,
  StakingHistory = 19,
}

export const stepsDisplayNames: { [key in flowTypes]: any } = {
  swap: {
    Home: "Home",
    Agreement: "Disclaimer",
    ExtensionConnect: "Connect Wallets",
    Swap: "Bridge Tokens",
    Requests: "Bridge History",
    Success: "Transaction Details",
  },
  liquidityStaking: {
    Home: "Home",
    Agreement: "Disclaimer",
    ExtensionConnect: "Connect Wallets",
    Overview: "Overview",
    AddLiquidity: "Add Liquidity",
    Bridge: "Bridge Liquidity Tokens",
    BridgeHistory: "Bridge Liquidity History",
    Staking: "Stake Liquidity",
    Success: "Transaction Details",
    StakingHistory: "Staking History",
  },
};

export type flowState = {
  metaFlowStep: number;
  metaFlowType: flowTypes | "";
  currentFlowStep: number;
  currentFlowType: flowTypes | "";
};

const initialState: flowState = {
  // MetaFlow keeps track of the bigger flow (the one selected in the "Home"/"Welcome" screen)
  //
  metaFlowStep: 0,
  metaFlowType: "",

  // CurrentFlow keeps track of the current flow.
  // Example: When staking liquidity the user might start in the liquidityFlow,
  // then go to the swapFlow and after that return to the liquidityFlow
  //
  currentFlowStep: 0,
  currentFlowType: "",
};

export const wizardStatusSlice = createSlice({
  name: "wizardStatus",
  initialState,
  reducers: {
    resetWizardStatusState: (state) => {
      state = initialState;
      return state;
    },
    storeWizardStatusState: (state, action) => {
      state = action.payload;
    },
    storeCurrentWizardFlowStep: (state, action) => {
      console.log("storeCurrentWizardFlowStep", action.payload);
      if (state.currentFlowStep !== action.payload) {
        state.currentFlowStep = action.payload;
      }
    },
    storeCurrentFlowType: (state, action) => {
      if (state.currentFlowType !== action.payload) {
        state.currentFlowType = action.payload;
      }
    },
    storeMetaFlowStep: (state, action) => {
      if (state.metaFlowStep !== action.payload) {
        state.metaFlowStep = action.payload;
      }
    },
    storeMetaFlowType: (state, action) => {
      if (state.metaFlowType !== action.payload) {
        state.metaFlowType = action.payload;
      }
    },
  },
});

export const {
  resetWizardStatusState,
  storeWizardStatusState,
  storeCurrentWizardFlowStep,
  storeCurrentFlowType,
  storeMetaFlowStep,
  storeMetaFlowType,
} = wizardStatusSlice.actions;

export default wizardStatusSlice.reducer;
