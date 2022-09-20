/**********************************************************************************
* Author: Bryce Check
* Date: 08/21/2022
* File: MessagingReducer.js
* Desc: This is a reducer to manage the state of the messaging service between all
*    the different components that depend on the state of the messages to render,
*    update and behave correctly.
**********************************************************************************/

import { createSlice, current } from '@reduxjs/toolkit';

export const messagingSlice = createSlice({
  name: 'messaging',
  initialState: {
    selectedConvo: null,
    conversations: [],
    currentMessages: []
  },
  reducers: {
    initialize: (state, action) => {
      state.conversations = action.payload;
      state.selectedConvo = action.payload.length === 0 ? null : action.payload[action.payload.length - 1];
    },
    selectConversation: (state, action) => {
      state.selectedConvo = action.payload;
      state.conversations.find(convo => convo.sid === action.payload.sid).isRead = true;
    },
    leaveConversation: (state, action) => {
      state.conversations = state.conversations.filter(convo => convo.sid !== action.payload.sid);
    },
    setMessages: (state, action) => {
      state.currentMessages = action.payload;
    },
    addMessage: (state, action) => {
      state.currentMessages.push(action.payload);
      console.log(current(state.selectedConvo.sid), action.payload.convoId);
      if (state.selectedConvo.sid !== action.payload.convoId) {
        state.conversations.find(convo => convo.sid === action.payload.convoId).isRead = false;
      }
    },
    setMessageToUnread: (state, action) => {
      state.conversations.find(convo => convo.sid === action.payload).isRead = false;
    },
    newConversation: (state, action) => {
      for(var i = 0; i < state.conversations.length; i++) {
        if (state.conversations[i].sid === action.payload.sid) {
          state.selectedConvo = action.payload;
          return;
        }
      }
      state.conversations.push(action.payload);
      state.selectedConvo = action.payload;
    }
  }
});

export const { initialize, selectConversation, newConversation, leaveConversation, setMessages, addMessage, setMessageToUnread } = messagingSlice.actions;

export default messagingSlice.reducer;
