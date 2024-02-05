export const handleTabClosing = (event: any) => {
  event.preventDefault();
  console.log("Closing tab");
};

export const alertUserBeforeUnloads = (event: any) => {
  event.preventDefault();
  console.log("Exiting page");
};

export const isHostIframe = () => {
  return window.self !== window.top;
};

export const addBeforeUnloadEvents = () => {
  if (!isHostIframe()) {
    // Only add the event if we're not in an iframe
    window.addEventListener("beforeunload", alertUserBeforeUnloads);
    window.addEventListener("unload", handleTabClosing);
  }
};

export const removeBeforeUnloadEvents = () => {
  if (!isHostIframe()) {
    // Events were only added when we're not in an iframe
    window.removeEventListener("beforeunload", alertUserBeforeUnloads);
    window.removeEventListener("unload", handleTabClosing);
  }
};
