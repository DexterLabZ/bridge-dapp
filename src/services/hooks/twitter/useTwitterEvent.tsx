import constants from "../../../utils/constants";

export const useTwitterEvent = () => {
  const sendEventToTwitter = async (twclid: string) => {
    const payload = {
      conversions: [
        {
          conversion_time: new Date().toISOString(),
          event_id: constants.TWITTER_EVENT.EVENT_ID,
          identifiers: [{ twclid }],
        },
      ],
    };

    try {
      window?.twq("config", constants.TWITTER_EVENT.PIXEL_ID);

      window?.twq("event", constants.TWITTER_EVENT.EVENT_ID, payload);

      console.log("Event<twitter> sent successfully");
    } catch (error) {
      console.error("Error<twitter> sending event: ", error);
    }
  };

  return {
    sendEventToTwitter,
  };
};
