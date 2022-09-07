/**********************************************************************************
* Author: Bryce Check
* Date: 08/21/2022
* File: MessagingReducer.js
* Desc: This is a reducer to manage the state of the messaging service between all
*    the different components that depend on the state of the messages to render,
*    update and behave correctly.
**********************************************************************************/

import { createSlice } from '@reduxjs/toolkit';

export const messagingSlice = createSlice({
  name: 'messaging',
  initialState: {
    selectedConvo: null,
    conversations: [],
  },
  reducers: {
    initialize: (state, action) => {
      state.conversations = action.payload;
      state.selectedConvo = action.payload.length === 0 ? null : action.payload[action.payload.length - 1];
    },
    newMessage: (state, action) => {
      let idx = state.conversations.findIndex(convo => convo.customerID === action.payload.id);
      let convos = state.conversations;
      convos[idx].messages.push(action.payload);
      state.conversations = convos;
    },
    selectConversation: (state, action) => {
      state.selectedConvo = action.payload;
    }
  }
});

export const { initialize, newMessage, selectConversation } = messagingSlice.actions;

export default messagingSlice.reducer;
