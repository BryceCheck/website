import React from 'react';
import ReactDOM from 'react-dom/client';

import Resume from './Components/Resume/Resume';

import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Resume/>
  </React.StrictMode>
);
