import Modal from "react-bootstrap/Modal";
import { useState, useEffect, useRef } from 'react';
import { changeConversation } from "../../Reducers/messagingReducer";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

import { HOST } from "../../consts";
    
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

const CustomerListSelectModal = (props) => {

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
          console.log('new client:', newClient);
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
        {phoneClientsBody}
      </div> 
      <div className='modal-status-container'>{statusMessage}</div>
    </Modal.Body>
  </Modal>
}

export default CustomerListSelectModal;