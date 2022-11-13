import Modal from "react-bootstrap/Modal";
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import axios from "axios";
import { HOST } from "../../consts";
    
import './CustomerSelectModal.css';
import { useGetCurrentUser } from "./Hooks";

const CustomerListSelectModal = (props) => {

  const [phoneClientsBody, setPhoneClientsBody] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const currUser = useGetCurrentUser();

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
          console.log(res.data);
          body = res.data.phoneClients.map(client => {
            return <div 
              className='client-list-item' 
              key={client.ClientId} 
              onClick={() => setSelectedRecipient(client.ClientId)}
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
  }, [currUser]);
  
  return <Modal show={props.show} onHide={props.onHide} centered className='textit-modal'>
    <Modal.Header centered>
      <h1>Choose Customer</h1>
    </Modal.Header>
    <Modal.Body centered>
      <div className='modal-status-container'>{statusMessage}</div>
      {phoneClientsBody}
    </Modal.Body>
    <Modal.Footer style={{justifyContent: 'center'}}>
      <button className='accept-button' onClick={() => props.handleAccept(selectedRecipient, setStatusMessage, currUser)}>
        Start Conversation
      </button>
    </Modal.Footer>
  </Modal>
}

export default CustomerListSelectModal;