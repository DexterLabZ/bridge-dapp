import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { storeAgreementItems } from "../../../services/redux/agreementItemsSlice";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AgreementStep = ({ onStepSubmit = () => { } }) => {
  const agreementItems = useSelector((state: any) => state.agreementItems?.checkboxItems);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({ mode: "onBlur" });
  const dispatch = useDispatch();

  useEffect(() => {
    let agreedEverything = true;
    agreementItems.forEach((item: any, i: number) => {
      if (item.status) {
        setValue("agreementItem" + i, item.status, { shouldValidate: true });
      } else {
        agreedEverything = false;
      }
    });

    if (agreedEverything) {
      onStepSubmit();
    }
  }, []);

  const changeAgreementItems = (i: number, status: boolean) => {
    const updatedAgreementItems = JSON.parse(JSON.stringify(agreementItems));
    updatedAgreementItems[i].status = status == true ? 1 : 0;

    dispatch(storeAgreementItems(updatedAgreementItems));
  };

  const onFormSubmit = () => {
    onStepSubmit();
  };

  return (
    <div className="mt-4">
      <h1> Keep this in mind ! </h1>
      <form onSubmit={handleSubmit(() => onFormSubmit())}>
        <>
          {agreementItems.map((agreementItem: any, i: number) => {
            return (
              <div key={"agreementItem-" + i} className="mt-4 text-left custom-checkbox-container mb-1">
                <label className="pt-3 pb-3 custom-checkbox" htmlFor={agreementItems[i].label}>
                  <input
                    className="mr-3 custom-checkbox"
                    id={agreementItems[i].label}
                    type="checkbox"
                    value={agreementItems[i].status}
                    {...register("agreementItem" + i, { required: true })}
                    onChange={(e) => {
                      changeAgreementItems(i, e.target.checked);
                      setValue("agreementItem" + i, e.target.checked, { shouldValidate: true });
                    }}></input>
                  <span
                    className={`custom-checkmark ${errors["agreementItem" + i] ? "custom-label-checkbox-error" : ""
                      }`}></span>
                  <span className={`${errors["agreementItem" + i] ? "custom-label-text-error" : ""}`}>
                    {agreementItem.label}
                  </span>
                </label>
              </div>
            );
          })}
        </>
        <div className={`button primary w-100 mt-4 ${Object.keys(errors).length ? "disabled" : ""}`}>
          Next
          <input className="ghost-over cursor-pointer" type="submit" name="submitButton"></input>
        </div>
      </form>
    </div>
  );
};

export default AgreementStep;
