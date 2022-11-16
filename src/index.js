import React from 'react';
import ReactDOM from 'react-dom/client';
import { 
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import { Provider } from 'react-redux';

import store from './store';
import Home from './Components/Messaging/TextItHome';
import Chatroom from './Components/Messaging/Chatroom';
import Profile from './Components/Messaging/Profile';
import Reports from './Components/Messaging/Reports';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"
      integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi"
      crossorigin="anonymous"
    />
    <Router>
      <Routes>
        <Route exact path="/" element={<Home/>}/>
        <Route path="/messages" element={<Chatroom/>}/>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/report" element={<Reports/>}/>
      </Routes>
    </Router>
  </Provider>
);
