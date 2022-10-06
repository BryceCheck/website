import Modal from "react-bootstrap/Modal";
import { useState, useEffect } from 'react';

import axios from "axios";
import { HOST } from "../../consts";
    
import './ListSelectModal.css';

const ListSelectModal = (props) => {

  const [repList, setRepList] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  // Refresh the list of reps everytime the display is turned on, clear it when it's turned off
  useEffect(() => {
    // Only update the list when the display is turned on
    Promise.all([axios.get(HOST + '/online-reps'), axios.get(HOST + '/user-info')])
    .then(
      vals => {
        setRepList(vals[0].data.onlineReps.filter(rep => rep.id !== vals[1].data.userInfo.id).map(item => {
          return <div 
              className='rep-list-item' 
              key={item.id} 
              // style={{
              //   color: (selectedRecipient && selectedRecipient.id === currentUser.id) ? primaryColor : accentColor,
              //   backgroundColor: (selectedRecipient && selectedRecipient.id === currentUser.id) ? accentColor : primaryColor
              // }}
              onClick={() => {
                console.log(item.id);
                setSelectedRecipient(item.id)
              }}
            >
              {item.name}
            </div>;
        }));
      },
      err => {
        console.log(err.Error());
        setStatusMessage('Error occured while getting online reps!');
      }
    ).catch(console.error);

    return () => {setRepList([])};
  }, []);
  
  return <Modal show={props.display} onHide={props.setParentDisplay} centered className='textit-modal'>
    <Modal.Header closeButton centered>
      <h1>Transfer Conversation</h1>
    </Modal.Header>
    <Modal.Body centered>
      <div className='modal-status-container'>{statusMessage}</div>
      {repList}
    </Modal.Body>
    <Modal.Footer centered>
      <button className='accept-button' onClick={() => props.handleAccept(selectedRecipient.identity, setStatusMessage)}>
        Share
      </button>
    </Modal.Footer>
  </Modal>
}

export default ListSelectModal;