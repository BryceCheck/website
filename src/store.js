/***************************************************************************
* Author: Bryce Check
* Date: 08/21/2022
* File: store.js
* Desc: This is the redux store that combines the different reducers and
*     provides the rest of the app with access to the store through the
*     provider component which wraps the rest of the app in index.js.
***************************************************************************/

import { configureStore } from '@reduxjs/toolkit';
import messagingReducer from './Reducers/messagingReducer';

export default configureStore({
  reducer: {
    messaging: messagingReducer,
  }
});
