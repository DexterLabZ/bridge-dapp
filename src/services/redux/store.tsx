import { configureStore } from "@reduxjs/toolkit";
import walletReducer from "./walletSlice";
import connectionReducer from "./connectionSlice";
import referralReducer from "./referralSlice";
import requestsReducer from "./requestsSlice";
import globalConstantsReducer from "./globalConstantsSlice";
import wizardStatusReducer from "./wizardStatusSlice";
import liquidityStakingEntriesReducer from "./liquidityStakingEntriesSlice";
import agreementItemsReducer from "./agreementItemsSlice";

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    connection: connectionReducer,
    referral: referralReducer,
    requests: requestsReducer,
    globalConstants: globalConstantsReducer,
    wizardStatus: wizardStatusReducer,
    liquidityStakingEntries: liquidityStakingEntriesReducer,
    agreementItems: agreementItemsReducer,
  },
});
