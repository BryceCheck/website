import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

import store from './store';
import Resume from './Components/Resume/Resume';
import Chatroom from './Components/Messaging/Chatroom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <Router>
        <Routes>
          <Route path='/' element={<Resume/>}/>
          <Route path='/messages' element={<Chatroom/>}/>
        </Routes>
      </Router>
    </React.StrictMode>
  </Provider>
);
