const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const request = require('request-promise-native');
const bodyParser = require('body-parser');
const { auth } = require('express-openid-connect');
const { default: axios } = require('axios');

const HOST = 'http://brycecheck.com';
const API_PORT = 3001;
const TWILIO_NUMBER = '+17245586932';

// Authentication configuration
const config = {
  authRequired: true,
  auth0Logout: true,
  secret: process.env.CLIENT_SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  authorizationParams: {
    response_type: 'code',
    audience: 'TextItBackend',
    scope: 'openid profile email',
  },
};

const getAuthorizationHeaderString = async (accessToken) => {
  let { token_type, access_token, isExpired, refresh } = accessToken;
  if (isExpired()) {
    ({ access_token } = await refresh());
  }
  return `${token_type} ${access_token}`;
}

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// attaches the build path items to the server
app.use(express.static(path.join(__dirname, 'build')));

// gets a token from the backend
app.get('/token', async (req, res) => {
  // Get the access token for the API
  const authHeaderStr = await getAuthorizationHeaderString(req.oidc.accessToken);
  // Get the chat token from the backend
  const chatToken = await request.get(HOST + ':' + API_PORT + '/access-token?email='+req.oidc.user.email, {
    headers: {
      Authorization: authHeaderStr,
    },
    json: true,
  });
  // check to make sure that it was successful
  res.json(chatToken);
});

// joins or makes conversations which already exist
app.post('/join-convo', async (req, res) => {
  // Get the auth header string
  const authStr = await getAuthorizationHeaderString(req.oidc.accessToken);
  // Make the request to the backend
  axios.post(HOST + ':' + API_PORT + '/join-conversation', {
    destination: req.body.destination,
    identity: req.oidc.user.email,
    twilioNumber: TWILIO_NUMBER
  }, {
    headers: {
      'Authorization': authStr
    }
  })
  .then(response => {
    res.json({sid: response.data.sid})
  }, _ => {
    res.sendStatus(401);
  })
});

// serves the pages
app.get(['/', '/messages'], (req, res) => {
    req.oidc.isAuthenticated() ? res.sendFile(path.join(__dirname, 'build', 'index.html')) : res.send('Logged Out');
});

app.listen(80);