const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const request = require('request-promise-native');
const { auth } = require('express-openid-connect');

const config = {
    authRequired: true,
    auth0Logout: true,
    secret: process.env.CLIENT_SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    authorizationParams: {
      response_type: 'code', // This requires you to provide a client secret
      audience: 'TextItBackend',
      scope: 'openid profile email read:products',
    },
};

const app = express();

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// attaches the build path items to the server
app.use(express.static(path.join(__dirname, 'build')));

// gets a token from the backend
app.get('/token', async (req, res) => {
    let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;
    if (isExpired()) {
      ({ access_token } = await refresh());
    }
    // Get the chat token from the backend
    const chatToken = await request.get('http://brycecheck.com' + ':' + '3001' + '/access-token', {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
      json: true,
    });
    // return the chat token to the frontend
    res.json(chatToken);
});

// serves the pages
app.get(['/', '/messages'], (req, res) => {
    req.oidc.isAuthenticated() ? res.sendFile(path.join(__dirname, 'build', 'index.html')) : res.send('Logged Out');
});

app.listen(80);