/*********************************************************************************
* Author: Bryce Check
* Date: 08/21/2022
* File: Conversation.js
* Desc: File which contains the interface for a CSR to message back and forth
*    with any customer who texts them.
*********************************************************************************/

import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Card, ListGroup } from 'react-bootstrap';

import { TWILIO_NUMBER } from '../../consts';

import './Conversation.css';

const inboundMsg = 'inbound-message';
const outboundMsg = 'outbound-message';

function Conversation(props) {

  const destinationRef = useRef(null);
  const messageRef = useRef(null);
  const [title, setTitle] = useState('');
  const [messages, setMessages] = useState(null);
  const [convo, setConvo] = useState(null);
  const convoData = useSelector(state => state.messaging.selectedConvo);

  useEffect(() => {
    if (props.client.current === null || (convo !== null && convoData === null)) return;
    props.client.current.getConversationBySid(convoData.sid)
    .then(convo => {
      setConvo(convo);
    });
  }, [props.client.current]);

  useEffect(() => {
    if(convo === null) return;
    // Get the participants
    convo.getParticipants()
    .then(participants => {
      const destination = participants.find(participant => participant.type !== 'chat');
      console.log(participants);
      setTitle(destination.identity);
    })
    // Get the messages
    convo.getMessages()
    .then(msgPaginator => {
      console.log(msgPaginator.items);
    })
  }, [convo]);

  const header = title ? title : <input ref={destinationRef} placeholder="Destination..." className="destination-text-input"/>

  return (
    <Card>
      <Card.Header>
        {header}
      </Card.Header>
      <Card.Body>
        <ListGroup>
          {/* Display all the messages in the conversation for each party */}
          {messages ? messages : <div className='convo-holder'>No messages sent yet...</div> }
        </ListGroup>
      </Card.Body>
      <Card.Footer>
        {/* Display a text input for the user to be able to send out a text message */}
        <div className='convo-input-container'>
          <input ref={messageRef} placeholder="Message..." className="convo-text-input"/>
          <button className='convo-send-button' onClick={() => {
            const message = messageRef.current.value;
            const destination = destinationRef.current.value;
            console.log(message, destination, convo);
            if (convo === null) {
              props.client.current.createConversation({
                friendlyName: destination,
                uniqueName:   destination
              })
              .then(convo => {
                return convo.join();
              })
              .then(async convo => {
                // Do error checking to make sure the phone number is valid
                await convo.addNonChatParticipant(TWILIO_NUMBER, destination);
                return convo.sendMessage(message);
              })
            }
          }}>Send</button>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default Conversation;
