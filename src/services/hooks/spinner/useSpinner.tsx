import React from "react";

export default () => {
  const [spinner, setSpinner] = React.useState(false);
  const [spinnerContent, setSpinnerContent] = React.useState("Loading ...");
  const [spinnerRootId, setSpinnerRootId] = React.useState("spinner-root");

  const handleSpinner = (content: any = false, rootId = spinnerRootId) => {
    //
    // How to use
    //
    // const { handleSpinner } = useContext(SpinnerContext);
    // const showSpinner = handleSpinner(<div>Whatever message you want here</div>);
    // showSpinner(false);

    setSpinner(!spinner);
    if (content) {
      setSpinnerContent(content);
    }
    setSpinnerRootId(rootId);

    return setSpinner;
  };

  return {spinner, handleSpinner, spinnerContent, spinnerRootId};
};
