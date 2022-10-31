import Modal from "react-bootstrap/Modal";
import { useState, useEffect } from 'react';

import axios from "axios";
import { HOST } from "../../consts";
    
import './ListSelectModal.css';
import { useGetCurrentUser } from "./Hooks";

const ListSelectModal = (props) => {

  const [repList, setRepList] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const currUser = useGetCurrentUser();

  // Refresh the list of reps everytime the display is turned on, clear it when it's turned off
  useEffect(() => {
    // Only update the list when the display is turned on
    axios.get(HOST + '/online-reps')
    .then(
      res => {
        setRepList(res.data.onlineReps.filter(rep => rep.id !== currUser.id).map(item => {
          return <div 
              className='rep-list-item' 
              key={item.id} 
              onClick={() => {
                setSelectedRecipient(item.id)
              }}
            >
              {item.name}
            </div>;
        }));
      },
      err => {
        console.log(err);
        setStatusMessage('Error occured while getting online reps!');
      }
    ).catch(console.error);

    return () => {setRepList([])};
  }, [currUser]);
  
  return <Modal show={props.display} onHide={props.setParentDisplay} centered className='textit-modal'>
    <Modal.Header closeButton>
      <h1>Transfer Conversation</h1>
    </Modal.Header>
    <Modal.Body centered>
      <div className='modal-status-container'>{statusMessage}</div>
      {repList}
    </Modal.Body>
    <Modal.Footer style={{justifyContent: 'center'}}>
      <button className='accept-button' onClick={() => props.handleAccept(selectedRecipient, setStatusMessage, currUser)}>
        Share
      </button>
    </Modal.Footer>
  </Modal>
}

export default ListSelectModal;