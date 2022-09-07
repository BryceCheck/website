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
  const [title, setTitle] = useState(null);
  const [messages, setMessages] = useState([]);
  const [convo, setConvo] = useState(null);
  const convoData = useSelector(state => state.messaging.selectedConvo);

  function getDisplayMessage(twilioMsg) {
    let msgClass = twilioMsg.author === 'schultz' ? outboundMsg : inboundMsg;
    return <div className={msgClass}>{twilioMsg.body}</div>;
  }

  useEffect(() => {
    if (props.client.current === null || convoData === null) {
      setMessages([]);
      setConvo(null);
    } else {
      props.client.current.getConversationBySid(convoData.sid)
      .then(convo => {
        setConvo(convo);
      });
    }
  }, [props.client.current, convoData]);

  useEffect(() => {
    if(convo === null) {
      setTitle(null);
      return;
    }
    // Get the participants
    convo.getParticipants()
    .then(participants => {
      const destination = participants.find(participant => participant.type !== 'chat');
      const newTitle = destination ? destination.state.bindings.sms.address : 'No Name';
      setTitle(newTitle);
    })
    // Get the messages
    convo.getMessages()
    .then(msgPaginator => {
      const msgs = msgPaginator.items.map(msg => {
        let msgClass = msg.author === 'schultz' ? outboundMsg : inboundMsg;
        return <div className={msgClass}>{msg.body}</div>
      });
      setMessages(msgs);
    })
    convo.on('messageAdded', msg => {
      setMessages((msgs) => ([...msgs, getDisplayMessage(msg)]));
    });
  }, [convo]);

  const header = <div className='header'>
    {title ? title : <input ref={destinationRef} placeholder="Destination..." className="destination-text-input"/>}
    <button className='convo-leave-button' style={{display: convo ? 'block' : 'none'}} onClick={() => {
      convo.leave();
    }}>X
    </button>
  </div>

  return (
    <Card className='convo-holder'>
      <Card.Header>
        {header}
      </Card.Header>
      <Card.Body>
        <div className='msg-holder'>
          {/* Display all the messages in the conversation for each party */}
          {messages ? messages : <div className='convo-holder'>No messages sent yet...</div>}
        </div>
      </Card.Body>
      <Card.Footer>
        {/* Display a text input for the user to be able to send out a text message */}
        <div className='convo-input-container'>
          <input ref={messageRef} placeholder="Message..." className="convo-text-input"/>
          <button className='convo-send-button' onClick={() => {
            const message = messageRef.current.value;
            if (convo === null) {
              const destination = destinationRef.current.value;
              props.client.current.createConversation({
                friendlyName: destination,
                uniqueName:   destination
              })
              .then(convo => {
                convo.on('messageAdded', msg => {
                  console.log('adding new message from new convo');
                  setMessages((msgs) => ([...msgs, msg]));
                });
              })
              .then(convo => {
                return convo.join();
              })
              .then(convo => {
                // Do error checking to make sure the phone number is valid
                convo.addNonChatParticipant(TWILIO_NUMBER, destination);
                return convo;
              })
              .then(convo => {
                convo.sendMessage(message);
              })
            } else {
              convo.sendMessage(message);
            }
            messageRef.current.value = '';
          }}>Send</button>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default Conversation;
