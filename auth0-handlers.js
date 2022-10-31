const axios = require('axios');

const APP_URL = 'https://schultzcustomers.us.auth0.com';
const MANAGEMENT_API_URL = APP_URL + '/api/v2/';
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
  var userId = '';
  // Create an unverified user
  const userData = {
    "email": email,
    "email_verified": false,
    "verify_email": false,
    "phone_number": number,
    "email_verified": true,
    "user_metadata": {
      role: role
    },
    "app_metadata": {
      orgId: orgId
    },
    "name": name,
    "connection": process.env.AUTH0_USER_DB,
    "password": DEFAULT_PW
  }
  // Send out the request to the api
  return axios.post(MANAGEMENT_API_URL + 'users', userData, getAuthHeader())
  .then(
    // If successful then send out a password change request
    res => {
      userId = res.data.user_id;
      return changePassword(email);
    },
    err => {
      console.error('Request to create user failed:', err);
      throw err;
    }
  )
  .then(
    _ => {console.log('successfully sent out password reset')},
    // if the password change request ticket fails, delete the user
    err => {
      console.error('Error while sending out password change ticket:', err);
      axios.delete(MANAGEMENT_API_URL + 'users/' + userId, getAuthHeader());
      throw err;
    }
  )
}

// Change a user's password
const changePassword = (email) => {
  const pwChangeTicketData = {
    "client_id": process.env.CLIENT_ID,
    "email": email,
    "connection": process.env.AUTH0_USER_DB
  }
  return axios.post(APP_URL + '/dbconnections/change_password', pwChangeTicketData, getAuthHeader())
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