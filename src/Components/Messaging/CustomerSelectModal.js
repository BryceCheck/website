import Modal from "react-bootstrap/Modal";
import { useState, useEffect } from 'react';
import { useDispatch } from "react-redux";
import { changeConversation } from "../../Reducers/messagingReducer";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

import { HOST } from "../../consts";
    
import './CustomerSelectModal.css';

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

const CustomerListSelectModal = (props) => {

  const [phoneClientsBody, setPhoneClientsBody] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const dispatch = useDispatch();

  // Refresh the list of reps everytime the display is turned on, clear it when it's turned off
  useEffect(() => {
    // Only update the list when the display is turned on
    axios.get(HOST + '/phone-clients')
    .then(
      res => {
        var body;
        if(res.data.length === 0) {
          body = <div className="empty-clients-modal">
            <button className="empty-clients-add-button">
              <FontAwesomeIcon icon={faPlus}/>
            </button>
          </div>
        } else {
          body = res.data.phoneClients.map(client => {
            return <div 
              className='client-list-item' 
              key={client.ClientId}
              onClick={() => addConversation(props.client.current, client.CellPhone, props.onHide)}
            >
              {`${client.FirstName} ${client.LastName}`}
            </div>;
          })
        }
        setPhoneClientsBody(body);
        setStatusMessage('');
      },
      err => {
        console.error(`Error while retrieving phone clients ${err}`);
        setStatusMessage('Error occured while getting phone clients!');
      }
    ).catch(console.error);

    return () => {setPhoneClientsBody([])};
  }, []);
  
  return <Modal show={props.show} onHide={props.onHide} centered className='textit-modal'>
    <Modal.Header className='modal-title'>
      <h1 className='modal-title-text'>Choose Customer</h1>
    </Modal.Header>
    <Modal.Body centered>
      <div className='modal-status-container'>{statusMessage}</div>
      {phoneClientsBody}
    </Modal.Body>
  </Modal>
}

export default CustomerListSelectModal;