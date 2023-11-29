import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Primitives } from "znn-ts-sdk";
import { storeReferralCode } from "../../services/redux/referralSlice";
import { getReferralAddress, setReferralCodeAddress, unmangleReferralCode } from "../../utils/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const ReferralCodeInterpreter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const referralCode = searchParams.get("referral") || "";
    const referrerAddress = unmangleReferralCode(referralCode);

    if (referrerAddress) {
      console.log("New referral code detected", referrerAddress);
      if (!getReferralAddress()) {
        console.log("Using: ", referrerAddress);
        try {
          if (Primitives.Address.parse(referrerAddress)) {
            setReferralCodeAddress(referrerAddress || "");
            dispatch(storeReferralCode(referralCode));
            toast(`Referral code applied. You will receive 1% bonus when unwrapping wZNN => ZNN and wQSR => QSR`, {
              position: "bottom-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: true,
              type: "success",
              theme: "dark",
              toastId: "validReferralCode",
            });
          }
        } catch (err) {
          console.error("Invalid Referral Code");
          toast("Invalid Referral Code", {
            position: "bottom-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "error",
            theme: "dark",
            toastId: "invalidReferralCode",
          });
        }
      } else {
        console.log("Detected existing referral code: ", getReferralAddress());
        console.log("Using the existing one", getReferralAddress());
        dispatch(storeReferralCode(getReferralAddress()));
      }
    }
  }, [dispatch, searchParams]);

  useEffect(() => {
    const referralAddress = getReferralAddress();

    if (referralAddress) {
      console.log("Using: ", referralAddress);
      dispatch(storeReferralCode(referralAddress));
    }
  }, [dispatch]);

  return <></>;
};

export default ReferralCodeInterpreter;
