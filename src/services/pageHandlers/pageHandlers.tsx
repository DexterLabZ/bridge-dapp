export const handleTabClosing = (event: any) => {
  event.preventDefault();
  console.log("Closing tab");
};

export const alertUserBeforeUnloads = (event: any) => {
  event.preventDefault();
  console.log("Exiting page");
};

export const addBeforeUnloadEvents = () => {
  window.addEventListener("beforeunload", alertUserBeforeUnloads);
  window.addEventListener("unload", handleTabClosing);
};

export const removeBeforeUnloadEvents = () => {
  window.removeEventListener("beforeunload", alertUserBeforeUnloads);
  window.removeEventListener("unload", handleTabClosing);
};
