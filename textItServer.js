const express = require('express');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const { auth, requiresAuth } = require('express-openid-connect');
const { default: axios } = require('axios');
const { WebSocket, WebSocketServer } = require('ws');
const { createUser, deleteUser, connectToAuth0, getUser, logoutUser, getUsersInOrg } = require('./auth0-handlers');
const socketMap = new Map();
var ApiSocket = null;

const WS_HOST = 'wss://brycecheck.com';
const HOST = 'https://brycecheck.com';
const API_PORT = 3001;
const TWILIO_NUMBER = '+17245586932';
const GET = 'get';
const POST = 'post';

// Authentication configuration
const config = {
  authRequired: false,
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
// Redirect all non-http requests to port 443
app.use(function(req, res, next) {
  if (!req.secure) {
     return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
})
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));
// Allow this server to reach out to the auth server
app.use(cors());
// attaches the build path items to the server
app.use(express.static(path.join(__dirname, 'build')));

// gets a token from the backend
app.get('/token', requiresAuth(), async (req, res) => {
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
app.get('/user-info', requiresAuth(), (req, res) => {
  // Get the role of the current user
  getUser(req.oidc.user.email)
  .then(
    response => {
      // return just the needed information to the front end
      res.json({userInfo: {
        name: req.oidc.user.name,
        firstName: req.oidc.user.given_name,
        lastName: req.oidc.user.family_name,
        email: req.oidc.user.email,
        role: response[0].user_metadata.role,
        org: 'Schultz Technologies',
        id: req.oidc.user.email // will be switched to a UUID once DB's are implemented
      }});
    }
  )
  .catch(err => console.error('unhandled error while getting user-info:', err));
});

// Gets all the reps from the database server per org
app.get('/reps', requiresAuth(), (req, res) => {
  // Get the current user org
  getUser(req.oidc.user.email)
  // Get all the users in the organization
  .then(
    userData => getUsersInOrg(userData[0].app_metadata.orgId),
    err => {
      console.error('Error while retrieving the reps in the org:', err);
      res.send(400);
    }
  )
  // Return the users in the org
  .then(
    usersInOrg => res.send({reps: usersInOrg.map(user => {
      return {
        name: user.name,
        email: user.email,
        role: user.user_metadata.role
      }
    })}),
    err => {
      console.error('Error while getting users in org:', err);
      res.send(400);
    }
  )
})

// Gets the online reps from the backend server per Org
app.get('/online-reps', requiresAuth(), (req, res) => {
  // Get the current logged in user information
  getUser(req.oidc.user.email)
  // Find all reps in the organization of the same user
  .then(
    userData => getUsersInOrg(userData[0].app_metadata.orgId),
    err => {
      console.error('Error while getting users in org:', err);
      res.sendStatus(400);
    }
  )
  // Send back the users in the org
  .then(
    usersInOrg => {
      const users = usersInOrg.map(user => {
        return {
          id: user.email,
          name: user.name
        };
      });
      res.send({onlineReps: users});
    },
    err => {
      console.error('Error while retrieiving users in org:', err);
      res.sendStatus(400);
    }
  )
});

// joins or makes conversations which already exist
app.post('/join-convo', requiresAuth(), (req, res) => {
  // Get the users in the org
  var identities;
  // Get the orgId of the user
  getUser(req.oidc.user.email)
  .then(
    userData => getUsersInOrg(userData[0].app_metadata.orgId),
    err => {
      console.error('Error while getting users in org:', err);
      res.send(400);
    }
  )
  // Get the users in the org
  .then(
    usersInOrg => {
      identities = usersInOrg.map(user => user.email);
    },
    err => {
      console.error('Error while retrieving users in org:', err);
      res.send(400);
    }
  )
  // Get the auth header string
  .then(
    _ => getAuthorizationHeaderString(req.oidc.accessToken),
    err => {
      console.error('Error while mapping user emails:', err);
      res.send(400);
    }
  )
  // Make the request to the backend
  .then(
    authStr => {
      return getAuthenticatedRequest(HOST + ':' + API_PORT + '/join-conversation', authStr, POST, {
        destination: req.body.destination,
        identities: identities,
        twilioNumber: TWILIO_NUMBER
      })
    },
    err => {
      console.error(err),
      res.sendStatus(400)
    }
  )
  .then(
    response => res.json({sid: response.data.sid}),
    _ => res.sendStatus(401));
});

app.post('/transfer-conversation', requiresAuth(), (req, res) => {
  console.log(req.body);
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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
})
app.get(['/messages', '/profile'], (req, res) => {
  req.oidc.isAuthenticated() ? res.sendFile(path.join(__dirname, 'build', 'index.html')) : res.redirect('/login');
});

// Handles the creating a user post request
app.post('/user', requiresAuth(),(req, res) => {
  if(!req.body.email, !req.body.phoneNumber, !req.body.name, !req.body.role) res.status(400).send('Missing create user data');
  // Get the orgId of the admin making the request
  getUser(req.oidc.user.email)
  // Send out the create user request
  .then(
    data => {
      const orgId = data.app_metadata ? data.app_metadata.orgId : 'Schultz Technologies';
      return createUser(orgId, req.body.email, req.body.phoneNumber, req.body.name, req.body.role);
    },
    _ => {
      res.status(401).send('Unauthorized request to create the user')
    }
  )
  .then(
    _ => res.status(200),
    err => {
      res.status(401).send('Could not create the new user')
      console.error(err);
    }
  )
  .catch(err => console.error('Unhandled error:', err));
});

app.get('/logout-user', requiresAuth(), logoutUser);

app.delete('/user', requiresAuth(), deleteUser);

// Starts the service
const startService = () => {
  connectToAuth0(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
  // Create the configuration options for keys, certs, etc for the https server
  const options = {
    key: fs.readFileSync(process.env.KEY_LOC),
    cert: fs.readFileSync(process.env.CERT_LOC)
  }

  // Create the websocket server
  const socketServer = new WebSocketServer({ noServer: true });
  socketServer.on('connection', (ws, req) => {
    // store the socket information by client identity
    const id = req.url.split('?')[1].split('=')[1];
    socketMap.set(id, ws);
    console.log('connected to websocket with client id:', id);
  })

  // Create the https server
  const httpsServer = https.createServer(options, app);
  // Handle protocol upgrade requests
  httpsServer.on('upgrade', (req, socket, head) => {
    // Make sure that that upgrade requests are authenticated as well
    socketServer.handleUpgrade(req, socket, head, ws => {
      socketServer.emit('connection', ws, req);
    });
  });

  // Create a websocket client to the backend
  const ws = new WebSocket(WS_HOST + ':' + API_PORT);
  ws.on('error', (err) => {
    console.error('Error with API websocket:', err);
  });
  ws.on('connection', () => {
    console.log('connected to websocket server!');
  });
  ws.on('message', (data) => {
    // Transform received text into javascript object
    console.log('data received:', data);
    // Find type of message
    // Handle that type of message
  });
  httpsServer.listen(443);

  // Create a server listening on 80 to redirect to https @443
  const redirectApp = express();
  redirectApp.use('/', (req, res, next) => {
    res.redirect("https://" + req.headers.host + req.url);
  });
  redirectApp.listen(80);
}

startService();