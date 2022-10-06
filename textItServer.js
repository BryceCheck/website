const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const { auth } = require('express-openid-connect');
const { default: axios } = require('axios');

const HOST = 'http://brycecheck.com';
const API_PORT = 3001;
const TWILIO_NUMBER = '+17245586932';
const GET = 'get';
const POST = 'post';

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

const getAuthorizationHeaderString = (accessToken) => {
  let { token_type, access_token, isExpired, refresh } = accessToken;
  if (isExpired()) {
    return refresh().then(res => `${token_type} ${res.access_token}`)
  }
  return Promise.resolve(`${token_type} ${access_token}`);
}

const getAuthenticatedRequest = (url, authString, method, data, customConfig) => {
  const config = customConfig ? customConfig : {headers: {Authorization: authString}};
  return method === GET ? axios.get(url, config) : axios.post(url, data, config);
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
  getAuthorizationHeaderString(req.oidc.accessToken)
  .then(
    // Authenitcate request to API server
    authStr => getAuthenticatedRequest(HOST + ':' + API_PORT + '/access-token?email='+req.oidc.user.email, authStr, GET), 
    // Return error of retrieving access token for API server
    response => res.sendStatus(response.status))
  .then(
    // Successful retrieval
    response => res.json({accessToken: response.data.accessToken}),
    // Failure to retrieve
    response => res.sendStatus(response.status)
  )
  .catch(err => {console.error('Error getting auth token:', err)});
});

// gets the user info from the oidc token
app.get('/user-info', (req, res) => {
  res.json({userInfo: {
    id: req.oidc.user.email
  }})
});

// Gets the online reps from the backend server
app.get('/online-reps', (req, res) => {
  // Get the auth string for the API

  getAuthorizationHeaderString(req.oidc.accessToken)
  // Query the API for the online reps
  .then(
    authStr => getAuthenticatedRequest(HOST + ':' + API_PORT + `/online-reps?id=${req.oidc.user.email}`, authStr, GET),
    response => res.sendStatus(response.status))
  // Return the list of online reps to the client
  .then(
    // Successful retrieval of online reps
    backendRes => res.json(backendRes.data), 
    // Failure to retrieve online reps
    backendRes => res.sendStatus(backendRes.status)
  );
});

// joins or makes conversations which already exist
app.post('/join-convo', (req, res) => {
  // Get the auth header string
  getAuthorizationHeaderString(req.oidc.accessToken)
  // Make the request to the backend
  .then(
    authStr => getAuthenticatedRequest(HOST + ':' + API_PORT + '/join-conversation', authStr, POST, {
      destination: req.body.destination,
      identity: req.oidc.user.email,
      twilioNumber: TWILIO_NUMBER
    }),
    response => res.sendStatus(response.status))
  .then(
    response => res.json({sid: response.data.sid}),
    _ => res.sendStatus(401));
});

app.post('/transfer-conversation', (req, res) => {
  // Get the auth string
  getAuthorizationHeaderString(req.oidc.accessToken)
  // Create authenticated request
  .then(
    authStr => getAuthenticatedRequest(HOST + ':' + API_PORT + '/transfer-conversation', authStr, POST, req.body),
    err => console.log('Attempt to get Auth String has failed:', err)
  )
  // Deal with success or failure of the request
  .then(apiResponse => res.sendStatus(apiResponse.status));
});

// serves the pages
app.get(['/', '/messages'], (req, res) => {
    req.oidc.isAuthenticated() ? res.sendFile(path.join(__dirname, 'build', 'index.html')) : res.redirect('/login');
});

app.listen(80);