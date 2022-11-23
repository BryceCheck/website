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
    currentMessages: []
  },
  reducers: {
    initialize: (state, action) => {
      state.conversations = action.payload;
      state.selectedConvo = action.payload.length === 0 ? null : action.payload[action.payload.length - 1];
    },
    selectConversation: (state, action) => {
      state.selectedConvo = action.payload;
      if(action.payload === null) return;
      state.conversations.find(convo => convo.sid === action.payload.sid).isRead = true;
    },
    changeConversation: (state, action) => {
      if(!action.payload) return;
      state.selectedConvo = state.conversations.find(convo => convo.sid === action.payload);
    },
    leaveConversation: (state, action) => {
      state.conversations = state.conversations.filter(convo => convo.sid !== action.payload.sid);
      // find the next conversation which isn't the one we're deleting
      state.selectedConvo = state.conversations > 1 ? state.conversations.find(convo => convo.sid !== action.payload.sid) : null;
    },
    setMessages: (state, action) => {
      state.currentMessages = action.payload;
    },
    addMessage: (state, action) => {
      state.currentMessages.push(action.payload);
      if (state.selectedConvo.sid !== action.payload.convoId) {
        state.conversations.find(convo => convo.sid === action.payload.convoId).isRead = false;
      }
    },
    addPreviousMessages: (state, action) => {
      state.currentMessages = [...action.payload, ...state.currentMessages];
    },
    setMessageToUnread: (state, action) => {
      state.conversations.find(convo => convo.sid === action.payload).isRead = false;
    },
    setMessageToRead: (state, action) => {
      state.conversations.find(convo => convo.sid === action.payload).isRead = true;
    },
    editConversationTitle: (state, action) => {
      state.conversations.find(convo => convo.sid === action.payload.sid).title = action.payload.title;
      if(state.selectedConvo.sid === action.payload.sid) state.selectedConvo.title = action.payload.title;
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

export const { 
  initialize,
  selectConversation,
  newConversation,
  changeConversation,
  leaveConversation,
  setMessages,
  addMessage,
  editConversationTitle,
  setEditingConversationTitle,
  setMessageToUnread,
  setMessageToRead,
  addPreviousMessages 
} = messagingSlice.actions;

export default messagingSlice.reducer;
