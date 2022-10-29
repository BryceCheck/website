const axios = require('axios');

const MANAGEMENT_API_URL = 'https://schultzcustomers.us.auth0.com/api/v2/';
const DEFAULT_PW = 'TextIt123!';
var auth0AccessToken = '';

// Create the auth header
const getAuthHeader = () => {return {headers: {Authorization: `Bearer ${auth0AccessToken}`}}};

// Gets an auth token from the API Management console
const connectToAuth0 = (id, secret) => {
  const tokenData = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: id,
    client_secret: secret,
    audience: 'https://schultzcustomers.us.auth0.com/api/v2/'
  });
  const headers = {headers: {'content-type': 'application/x-www-form-urlencoded'}};
  axios.post('https://schultzcustomers.us.auth0.com/oauth/token', tokenData, headers)
  .then(function (response) {
    auth0AccessToken = response.data.access_token;
  }).catch(function (error) {
    console.error(error);
  });
};
  
// Create a user
const createUser = (orgId, email, number, name, role) => {
  // Create an unverified user
  const userData = {
    "email": email,
    "phone_number": number,
    "email_verified": false,
    "user_metadata": {
      role: role
    },
    "app_metadata": {
      orgId: orgId
    },
    "name": name,
    "connection": process.env.AUTH0_USER_DB,
    "verify_email": false,
    "password": DEFAULT_PW
  }
  // Send out the request to the api
  return axios.post(MANAGEMENT_API_URL + 'users', userData, getAuthHeader())
  .then(
    // If successful then send out a password change request
    res => {
      console.log('user successfully created:', res);
      userId = res.user_id;
      const pwChangeTicketData = {
        "result_url": "http:/" + process.env.APP_URL + "/callback",
        "user_id": userId,
        "connection_id": process.env.AUTH0_DB_ID,
        "mark_email_as_verified": true,
        "includeEmailInRedirect": true,
        "email": email
      }
      return axios.post(MANAGEMENT_API_URL + 'tickets/password-change', pwChangeTicketData, getAuthHeader())
    },
    err => {
      console.error(err.response.data);
      throw err;
    }
  )
  .then(
    _ => {},
    // if the password change request ticket fails, delete the user
    err => {
      console.error('Error while sending out password change ticket', err.response.data);
      axios.delete(MANAGEMENT_API_URL + 'users/' + userId, getAuthHeader());
      throw err;
    }
  )
}
  
// Delete a user
const deleteUser = (userId) => {
  if(!userId) res.sendStatus(400);
  axios.delete(MANAGEMENT_API_URL + 'users/' + userId, getAuthHeader())
  .then(
    _ => res.sendStatus(200),
    _ => res.sendstatus(401)
  );
}

// Get a user's roles
const getUserRoles = (userId) => {
  if(!userId) return;
  axios.get(MANAGEMENT_API_URL + 'users/' + userId + '/roles', getAuthHeader())
  .then(
    res => {
      return res.data;
    },
    err => {
      console.error(err);
      return err;
    }
  )
}

// Get an existing user
const getUser = (email) => {
  const config ={ 
    params: {
      email: email
    },
    ...getAuthHeader()
  };
  return axios.get(MANAGEMENT_API_URL + `users-by-email`, config)
  .then(
    res => res.data,
    err => {
      console.error(err.response.data);
      throw err;
    }
  )
}

// Add a role to a user
// Remove a user's role

module.exports = { 
  connectToAuth0, 
  createUser, 
  deleteUser,
  getUserRoles,
  getUser
};