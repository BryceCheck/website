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
    conversations: null,
  },
  reducers: {
    initialize: (state, action) => {
      let convos = action.payload.conversationsData.map(convoData => {
        return ({
          customerID: convoData.id,
          messages: convoData.messages,
          name: convoData.cuwstomerName,
          number: convoData.phoneNumber
        });
      });
      state.conversations = convos;
      state.selectedConvo = convos[convos.length - 1].customerID;
    },
    newMessage: (state, action) => {
      let idx = state.conversations.findIndex(convo => convo.customerID === action.payload.id);
      let convos = state.conversations;
      convos[idx].messages.push(action.payload);
      state.conversations = convos;
    },
  }
});

export const { initialize, newMessage } = messagingSlice.actions;

export default messagingSlice.reducer;
