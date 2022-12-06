const express = require('express');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const { auth, requiresAuth } = require('express-openid-connect');
const { default: axios } = require('axios');
const { createUser, deleteUser, connectToAuth0, getUser, logoutUser, getUsersInOrg } = require('./auth0-handlers');
const { error } = require('console');
var orionToken;

const HOST = 'https://fetchit-messaging.com';
const API_PORT = 3001;
const DB_API_PORT = 3002;
const TWILIO_NUMBER = '+17245586932';
const GET = 'get';
const POST = 'post';

const DB_URL = `${HOST}:${DB_API_PORT}`;
const API_URL = `${HOST}:${API_PORT}`;

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

// Gets the access token for the Orion API
const getOrionAccessToken = () => {
  axios.post(`${process.env.ISSUER_BASE_URL}/oauth/token`, {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    audience: `OrionApi`,
    grant_type: 'client_credentials'
  })
  .then(
    res => {
      orionToken = res.data.access_token;
    },
    err => console.error(`Error while retrieving Orion DB access token: ${err}`)
  )
}

const getAuthHeader = () => {return {headers: {Authorization: `Bearer ${orionToken}`}}};

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
    err => {
      console.error(`Error while getting authorization header string: ${err}`);
      res.sendStatus(400);
    }
  )
  .then(
    // Successful retrieval
    response => res.send({accessToken: response.data.accessToken}),
    // Failure to retrieve
    err => {
      console.error(`Error retrieving auth token: ${err}`);
      res.sendStatus(400);
    }
  )
  .catch(err => {console.error('Error getting auth token:', err)});
});

// gets the user info from the oidc token
app.get('/user-info', requiresAuth(), (req, res) => {
  var userInfo;
  // Get the user info from Auth0
  getUser(req.oidc.user.email)
  // Use the orgId to get the client information
  .then(
    response => {
      userInfo = response[0];
      return axios.get(`${DB_URL}/client?id=${response[0].app_metadata.orgId}`, getAuthHeader())
    },
    err => {
      console.error(`Error while retrieving user info: ${err}`);
      res.sendStatus(400);
    }
  )
  .then(
    response => {
      // return just the needed information to the front end
      res.json({userInfo: {
        name: req.oidc.user.name,
        firstName: req.oidc.user.given_name,
        lastName: req.oidc.user.family_name,
        email: req.oidc.user.email,
        role: userInfo.user_metadata.role,
        org: response.data.client.CompanyName,
        id: req.oidc.user.email
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
        role: user.user_metadata.role,
        id: user.user_id
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
  if(!req.body.destination) res.sendStatus(400);
  // Get the users in the org and messaging service id
  var identities, authHeaders, orgId, messagingSid;
  // Get the orgId of the user
  getUser(req.oidc.user.email)
  .then(
    userData => {
      orgId = userData[0].app_metadata.orgId;
      return getUsersInOrg(orgId);
    },
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
  // Get the messaging service id
  .then(
    authStr => {
      authHeaders = authStr;
      return axios.get(HOST + ':' + DB_API_PORT + `/client?id=${orgId}`, getAuthHeader());
    },
    err => {
      console.error(err),
      res.sendStatus(400)
    }
  )
  // Make the request to the backend to join the conversation
  .then(
    response => {
      messagingSid = response.data.client.messagingserviceid;
      return getAuthenticatedRequest(HOST + ':' + API_PORT + '/create-conversation', authHeaders, POST, {
        destination: req.body.destination,
        identities: identities,
        msgServiceId: messagingSid
      })
    },
    err => console.error(`Error while retrieving client information: ${err}`)
  )
  .then(
    response => res.json({sid: response.data.sid}),
    err => {
      console.error(`Error while creating conversation: ${err}`);
      res.sendStatus(400);
    }
  )
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
app.get(['/messages', '/profile', '/report'], (req, res) => {
  req.oidc.isAuthenticated() ? res.sendFile(path.join(__dirname, 'build', 'index.html')) : res.redirect('/login');
});

// Handles the creating a user post request
app.post('/user', requiresAuth(),(req, res) => {
  if(!req.body.email, !req.body.phoneNumber, !req.body.name, !req.body.role) res.sendStatus(400);
  // Get the orgId of the admin making the request
  getUser(req.oidc.user.email)
  // Send out the create user request
  .then(
    data => {
      const user = data[0];
      const orgId = user.app_metadata ? user.app_metadata.orgId : 'Schultz Technologies';
      return createUser(orgId, req.body.email, req.body.phoneNumber, req.body.name, req.body.role);
    },
    err => console.error(`Error while getting user from OAuth: ${err}`)
  )
  .then(
    _ => res.sendStatus(200),
    err => {
      res.sendStatus(400);
      console.error(err);
    }
  )
  .catch(err => console.error('Unhandled error:', err));
});

app.delete('/user', requiresAuth(), (req, res) => {
  if(!req.body.id) {
    res.sendStatus(400);
    return;
  }
  deleteUser(req.body.id)
  .then(
    _ => res.sendStatus(200),
    err => {
      res.sendStatus(400);
      console.error(`Error while deleting user: ${err}`);
    }
  )
})

app.get('/phone-client', requiresAuth(), (req, res) => {
  // Make sure the required data is there
  if(!req.query.number) return res.sendStatus(400);
  // Get the orgId from Auth0
  getUser(req.oidc.user.email)
  // Get the internal identifier from the database
  .then(
    response => axios.get(`${DB_URL}/client?id=${response[0].app_metadata.orgId}`, getAuthHeader()),
    err => {
      console.error(`Error while retrieving internal id from database: ${err}`);
      res.sendStatus(400);
    }
  )
  // Send internalIdentifer and number to database for query
  .then(
    response => axios.get(`${DB_URL}/phone-client?number=${req.query.number}&internalId=${response.data.client.InternalIdentifier}`, getAuthHeader()),
    err => {
      console.error(`Error while getting user from Auth0: ${err}`);
      res.sendStatus(400);
    }
  )
  // Return response
  .then(
    response => {
      res.send(response.data.phoneClient);
    },
    err => {
      console.error(`Error while getting customer id from phone number from orion: ${err}`);
      res.sendStatus(404);
    }
  )
})

// Retrieves the client that the auth0 user is a part of
app.get('/client', requiresAuth(), (req, res) => {
  // Get the user information from Auth0
  getUser(req.oidc.user.email)
  // Query the database service for the client information using orgId from user info
  .then(
    user => axios.get(`${DB_URL}/client?id=${user[0].app_metadata.orgId}`, getAuthHeader()),
    err => {
      console.error(`Error while retrieving customer from auth0: ${err}`);
      res.sendStatus(400);
    }
  )
  // Return the request information to the front end
  .then(
    response => res.send({client: response.data.client}),
    err => {
      console.error(`Error while retrieving client information from database: ${err}`);
      res.sendStatus(400);
    }
  )
});

// Gets the phone clients in the organization
app.get('/phone-clients', requiresAuth(), (req, res) => {
  var orgId;
  // Get the pagination data from the query
  var clientsPerPage = 10, pageNumber = 0, firstName = '', lastName = '', number='';
  if(req.query.clientsPerPage) {
    clientsPerPage = req.query.clientsPerPage;
  }
  if(req.query.pageNumber) {
    pageNumber = req.query.pageNumber;
  }
  // Handle extra query
  var query = '';
  if(req.query.firstName) {
    query = `&firstName=${req.query.firstName}`;
  }
  if (req.query.lastName) {
    query += `&lastName=${req.query.lastName}`;
  }
  if (req.query.number) {
    query = `&number=${req.query.number}`;
  }
  // Get the org id from the Auth0 database
  getUser(req.oidc.user.email)
  // Get the internal id from orion
  .then(
    user => {
      orgId = user[0].app_metadata.orgId;
      return axios.get(`${DB_URL}/client?id=${orgId}`, getAuthHeader());
    },
    err => {
      console.error(`Error while getting user from Auth0: ${err}`);
      res.sendStatus(400);
    }
  )
  // Get the Phone clients from Orion
  .then(
    response => {
      axios.get(`${DB_URL}/phone-clients?internalId=${response.data.client.InternalIdentifier}&page=${pageNumber}&limit=${clientsPerPage}${query}`, getAuthHeader())
      .then(
        response => {
          console.log(response.data);
          res.send(response.data)
        },
        err => {
          res.sendStatus(400);
          console.error(`Error while retrieiving customers in orgainization: ${err}`);
        }
      )
    }
  )
});

// Creates a new phone client in the orion database
app.post('/phone-client', requiresAuth(), (req, res) => {
  var orgId;
  // Make sure that the request contains the required data
  if (!req.body.number || !req.body.firstName || !req.body.lastName) return res.sendStatus(400);
  // Get the org id from the Auth0 database
  getUser(req.oidc.user.email)
  // Get the internal id from orion
  .then(
    user => {
      orgId = user[0].app_metadata.orgId;
      return axios.get(`${DB_URL}/client?id=${orgId}`, getAuthHeader());
    },
    err => {
      console.error(`Error while getting user from Auth0: ${err}`);
      res.sendStatus(400);
    }
  )
  // Make the request to create the new phone client
  .then(
    response => axios.post(`${DB_URL}/phone-client`, {
      internalId: response.data.client.InternalIdentifier,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      number: req.body.number
    }, getAuthHeader()),
    err => {
      console.error(`Error while retrieving client from Auth0: ${err}`);
      res.sendStatus(400);
    }
  )
  // Create a new conversation with the phone client
  
  // Return the status to the client
  .then(
    _ => res.sendStatus(200),
    err => console.error(`Error while creating new phone client: ${err}`)
  )
});

app.patch('/phone-client', requiresAuth(), (req, res) => {
  console.log('patching phone client:', req.body);
  if (!req.body.FirstName || !req.body.LastName || !req.body.CellPhone) return res.sendStatus(400);
  console.log('here');
  // Get the orgId from from the auth0 user
  getUser(req.oidc.user.email)
  // Get the client information from orion
  .then(
    user => axios.get(`${DB_URL}/client?id=${user[0].app_metadata.orgId}`, getAuthHeader()),
    err => {
      console.error(`Error while retrieving user info from Auth0: ${err}`);
      res.sendStatus(400);
    }
  )
  // Update the name of the client on the orion api
  .then(
    response => axios.patch(`${DB_URL}/phone-client`, {
      ...req.body,
      internalId: response.data.client.InternalIdentifier
    }, getAuthHeader()),
    err => {
      console.error(`Error while retrieving client info from Orion: ${err}`);
      res.sendStatus(400);
    }
  )
  // Return status to user
  .then(
    _ => {
      console.log('patched');
      res.sendStatus(200)
    },
    err => {
      console.error(`Error while retrieving client information from Orion: ${err}`);
      res.sendStatus(400);
    }
  )
})

app.get('/get-report', requiresAuth(), (req, res) => {
  // Make sure the request has the proper data
  if(!req.query.type || !req.query.start) return res.sendStatus(400);
  // Get the orgId to get the internal id of the user's company
  getUser(req.oidc.user.email)
  .then(
    userData => axios.get(`${DB_URL}/client?id=${userData[0].app_metadata.orgId}`, getAuthHeader()),
    err => {
      console.error(`Error while retrieving user data from Auth0: ${err}`);
      res.sendStatus(400);
    }
  )
  // Get the internal identifier from the database
  .then(
    dbRes => {
      var query = `${DB_URL}/reports?type=${req.query.type}&start=${req.query.start}&internalId=${dbRes.data.client.InternalIdentifier}`;
      if(req.query.end) {
        query += `&end=${req.query.end}`
      }
      return axios.get(query, getAuthHeader());
    },
    err => {
      console.error(`Error while retrieving client information from the database: ${err}`);
      res.sendStatus(400);
    }
  )
  // Return the results of the orion API query
  .then(
    reportResponse => res.send(reportResponse.data),
    err => {
      console.error(`Error while getting report data: ${err}`);
      res.sendStatus(400);
    }
  )
})

app.get('/logout-user', requiresAuth(), logoutUser);

// Starts the service
const startService = () => {
  connectToAuth0(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
  getOrionAccessToken();
  // Create the configuration options for keys, certs, etc for the https server
  const options = {
    key: fs.readFileSync(process.env.KEY_LOC),
    cert: fs.readFileSync(process.env.CERT_LOC)
  }

  // Create the https server
  const httpsServer = https.createServer(options, app);
  httpsServer.listen(443);

  // Create a server listening on 80 to redirect to https @443
  const redirectApp = express();
  redirectApp.use('/', (req, res, next) => {
    res.redirect("https://" + req.headers.host + req.url);
  });
  redirectApp.listen(80);
}

startService();
