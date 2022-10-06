/*********************************************************************
* Author: Bryce Check, 08/20/2022
* File: Chatroom.js
* Desc: Chatroom page for messaging between clients in a web platform
*    that has a collapsable sidebar and a chat area.
*
* TODO:
* - Create a semi-transparent error message display for whole-app
*   errors
**********************************************************************/

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col } from 'react-bootstrap';
import { Client as ConversationsClient } from '@twilio/conversations';

import Navbar from '../Navbar/Navbar';
import Sidebar from './Sidebar';
import Conversation from './Conversation';
import { useGetCurrentUser } from './Hooks';
import { HOST, OUTBOUND_MSG, INBOUND_MSG, TOKEN_ENDPOINT } from '../../consts';

import { initialize, newConversation, leaveConversation, addMessage, setMessageToUnread } from '../../Reducers/messagingReducer';

import './Chatroom.css';


function Chatroom(props) {
  // placeholder for conversationsclient which is initialized after
  // the component has mounted and the token has been retrieved
  const selectedConvo = useSelector(state => state.messaging.selectedConvo);
  const curUser = useGetCurrentUser()
  const client = useRef(null);
  const currUserRef = useRef(null);
  const selectedConvoRef = useRef(null);
  selectedConvoRef.current = selectedConvo;
  currUserRef.current = curUser;
  const dispatch = useDispatch();

  // callback used to dispatch new messages if the message is to the current conversation
  const msgCallback = (msg, selectedConvo) => {
    if(msg.conversation.sid === selectedConvo.sid) {
      console.log('curUser, msg.author:', currUserRef.current, msg.author);
      const msgClass = msg.author === currUserRef.current.id ? OUTBOUND_MSG : INBOUND_MSG;
      if (msg.type === 'media') {
          // Get the url and display the img div
          msg.media.getContentTemporaryUrl()
          .then(
            url => {
              const styleClass = msgClass + ' media-message';
              dispatch(addMessage({type: 'media', url: url, key: msg.state.id, style: styleClass, convoId: msg.conversation.sid}));
            },
          )
          .catch(console.error);
      } else {
        dispatch(addMessage({type: 'text', style: msgClass, body: msg.body, key: msg.state.sid, convoId: msg.conversation.sid}));
      }
    } else {
      dispatch(setMessageToUnread(msg.conversation.sid));
    } 
  }

  // When the comonent mounts, retrieve a backend token
  useEffect(() => {
    const tokenURL = HOST + TOKEN_ENDPOINT;
    fetch(tokenURL, {
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(res => {
      return res.json();
    })
    // Initialize the chat client
    .then(data => {
      var newClient = new ConversationsClient(data.accessToken);
      client.current = newClient;
      client.current.on("conversationJoined", convo => {
        const convoData = {sid: convo.sid, title: convo.uniqueName ? convo.uniqueName : ''};
        dispatch(newConversation(convoData));
      });
      client.current.on("conversationLeft", convo => {
        const convoData = {sid: convo.sid, title: convo.friendlyName ? convo.friendlyName : ''};
        dispatch(leaveConversation(convoData));
      });
      client.current.on("messageAdded", msg => {
        msgCallback(msg, selectedConvoRef.current);
      })
      return client.current.getSubscribedConversations();
    })
    .then(convos => {
      const convoData = convos.items.map(convo => {
        return {
          sid: convo.sid,
          title: convo.uniqueName ? convo.uniqueName : '',
          isRead: true
        };
      });
      dispatch(initialize(convoData));
    })
    .catch(console.error);
  }, []);

  return (<>
    <Navbar/>
    <Container fluid className='messaging-container'>
      <Row xs='2'>
        <Col xs='4' md='2'>
          <Sidebar client={client}/>
        </Col>
        <Col xs='8' md='10'>
          <Conversation client={client}/>
        </Col>
      </Row>
    </Container>
  </>);
}

export default Chatroom;
