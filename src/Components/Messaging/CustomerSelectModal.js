import Modal from "react-bootstrap/Modal";
import { useState, useEffect, useRef } from 'react';
import { changeConversation } from "../../Reducers/messagingReducer";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

import { HOST, MAX_PHONE_NUMBER_LENGTH, MAX_QUERY_LENGTH } from "../../consts";
    
import './CustomerSelectModal.css';
import { handleFieldChange } from "../../utils";

const addConversation = (client, destinationNumber, onHide) => {
  const formattedNumber = `+1${destinationNumber}`;
  // See if the conversation already exists
  client.getConversationByUniqueName(formattedNumber)
  // Return the conversation sid if it does exist
  .then(
    convo => {return {data: {sid: convo.sid}}},
    // If it doesn't exist, create the convo
    err => {
      console.log(`Error while getting conversation by unique name: ${err}`);
      console.log(`Conversation with ${destinationNumber} doesn't exist. Creating new conversation`);
      return axios.post('/join-convo', {destination: formattedNumber})
    }
  )
  // set the selected conversation to the new conversation and hide the modal
  .then(
    res => {
      onHide();
    },
    err => console.error(`Error while joining conversation with ${formattedNumber}: ${err}`)
  )
}

const handleProfileCreation = (customerInfo, setError, setIsCreating, onHide, setNewClient) => {
  console.log(customerInfo);
  // Make sure the data is formatted properly
  if(customerInfo.CellPhone.length !== 10 || (customerInfo.HomePhone.length !== 10 && customerInfo.HomePhone.length !== 0)) {
    return setError('Phone numbers must be 10 digits long');
  }
  // Create the phone client
  axios.post('/phone-client', {
    number: customerInfo.CellPhone,
    firstName: customerInfo.FirstName, 
    lastName: customerInfo.LastName
  })
  // Create the conversation with the new phone client
  .then(
    _ => axios.post('/join-convo', {destination: `+1${customerInfo.CellPhone}`}),
    err => {
      setError('Error while creating new phone client! Please try again later');
      console.error(`Error while creating new phone client: ${err}`);
    }
  )
  // Close the modal
  .then(
    _ => {
      setNewClient({});
      setError('');
      onHide();
      setIsCreating(false);
    },
    err => {
      console.error(`Error while creating conversation with new phone client: ${err}`);
      setError('Error while creating conversation with new participant');
    }
  )
}

const createClientRows = (twilioClient, clients, onHide) => {
  return clients.map(client => {
    return <div 
      className='client-list-item' 
      key={client.ClientId}
      onClick={() => addConversation(twilioClient.current, client.CellPhone, onHide)}
    >
      {`${client.FirstName} ${client.LastName}`}
    </div>;
  });
}

const handleQuery = (e, setQueryString, setStatusMessage, setPhoneClientsBody, client, onHide) => {
  // Validate the input from the user
  if (e.target.value.length > MAX_QUERY_LENGTH) {
    return setStatusMessage('Search too long');
  }
  // Decide if the query is a name or number and format
  var query = '';
  if(/^[a-zA-Z() ]*$/.test(e.target.value)) {
    const names = e.target.value.split();
    if (names.length === 1) {
      query=`?firstName=${names[0]}`
    } else if(names.length >2) {
      query=`?firstName=${names[0]}&lastName=${names.slice(1).join(' ')}`
    }
  } else if(/^\d+$/.test(e.target.value)) {
    if(e.target.value.length > MAX_PHONE_NUMBER_LENGTH) {
      return setStatusMessage(`Phone numbers are only 10 digits long`);
    }
    query=`?number=${e.target.value}`
  } else {
    return setStatusMessage(`Please enter a valid name or number. Only numbers and letters`);
  }
  // Execute the query and the callback will update the display
  setQueryString(e.target.value);
  return axios.get(`/phone-clients${query}`)
  .then(
    res => setPhoneClientsBody(createClientRows(client, res.data.phoneClients, onHide)),
    err => {
      setStatusMessage('Error while getting customer list');
      console.error(`Error while getting customer list: ${err}`);
    }
  )
}

const CustomerListSelectModal = (props) => {

  const [queryString, setQueryString] = useState('');
  const [phoneClientsBody, setPhoneClientsBody] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [newClient, setNewClient] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const newClientRef = useRef(null);
  newClientRef.current = newClient;

  // Refresh the list of reps everytime the display is turned on, clear it when it's turned off
  useEffect(() => {
    // Only update the list when the display is turned on
    axios.get(HOST + '/phone-clients')
    .then(
      res => {
        var body = [];
        var addButton = [<div className="empty-clients-modal">
          <button className="add-client-button rounded-button" onClick={_ => setIsCreating(true)} style={{display: isCreating ? 'none' : 'block'}}>
            <FontAwesomeIcon icon={faPlus}/>
          </button>
          <div style={{display: isCreating ? 'flex' : 'none'}} className='button-container'>
            <button className='rounded-button' style={{display: isCreating ? 'block' : 'none'}} onClick={_ => setIsCreating(false)}>Cancel</button>
            <button className='rounded-button' style={{display: isCreating ? 'block' : 'none'}} onClick={_ => handleProfileCreation(newClientRef.current, setStatusMessage, setIsCreating, props.onHide, setNewClient)}>
              Submit
            </button>
          </div>
        </div>];
        if(isCreating) {
          body.push(
            <table>
              <tr>
                <td className='left-aligned bold title'><label>First Name</label></td>
                <td className='items-left'>
                  <input onChange={e => {handleFieldChange(e, 'FirstName', setNewClient, setStatusMessage)}} value={newClient.FirstName}/>
                </td>
              </tr>
              <tr>
                <td className='left-aligned bold title'><label>Last Name</label></td>
                <td className='items-left'><input onChange={e => {handleFieldChange(e, 'LastName', setNewClient, setStatusMessage)}} value={newClient.LastName}/></td>
              </tr>
              <tr>
                <td className='left-aligned bold title'><label>Home Phone</label></td>
                <td className='items-left'><input onChange={e => {handleFieldChange(e, 'HomePhone', setNewClient, setStatusMessage)}} value={newClient.HomePhone}/></td>
              </tr>
              <tr>
                <td className='left-aligned bold title'><label>Cell Phone</label></td>
                <td className='items-left'><input onChange={e => {handleFieldChange(e, 'CellPhone', setNewClient, setStatusMessage)}} value={newClient.CellPhone}/></td>
              </tr>
            </table>
          )
        } else if(res.data.length !== 0) {
          body.push(res.data.phoneClients.map(client => {
            return <div 
              className='client-list-item' 
              key={client.ClientId}
              onClick={() => addConversation(props.client.current, client.CellPhone, props.onHide)}
            >
              {`${client.FirstName} ${client.LastName}`}
            </div>;
          }));
        } else {
          body.push(<div>Add New Customer</div>)
        }
        body.push(addButton);
        setPhoneClientsBody(body);
        setStatusMessage('');
      },
      err => {
        console.error(`Error while retrieving phone clients ${err}`);
        setStatusMessage('Error occured while getting phone clients!');
      }
    ).catch(console.error);

    return () => {setPhoneClientsBody([])};
  }, [isCreating]);
  
  return <Modal show={props.show} centered className='textit-modal' onHide={_ => {
    setStatusMessage('');
    setNewClient({});
    setIsCreating(false);
    props.onHide();
  }}>
    <Modal.Header className='modal-title'>
      <h1 className='modal-title-text'>{isCreating ? 'Create' : 'Choose'} Customer</h1>
    </Modal.Header>
    <Modal.Body centered className="phone-clients-container">
      <div className='select-body-container'>
        <input style={{display: isCreating ? 'none' : 'inline-block'}} value={queryString} onChange={e => handleQuery(e, setQueryString, setStatusMessage, setPhoneClientsBody, props.client, props.onHide)}/>
        {phoneClientsBody}
      </div> 
      <div className='modal-status-container'>{statusMessage}</div>
    </Modal.Body>
  </Modal>
}

export default CustomerListSelectModal;