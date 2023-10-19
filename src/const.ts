export const IPC_CHANNEL_NAMES = {
  PING: "ping",
  SET_TITLE: "set-title",
  DIALOG: {
    OPEN_FILE: "dialog:openFile",
  },
  ASYNC_MSG: "asynchronous-message",
  ASYNC_REPLY: "asynchronous-reply",
  SYNC_MSG: "synchronous-message",

  // Message via WebContents instance
  WEB_CONTENTS: {
    UPDATE_COUNTER: "update-counter",
    COUNTER_VALUE: "counter-value",
  },
};
