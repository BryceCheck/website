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
import { useGetCurrentUser, useIsOnScreen } from './Hooks';
import { HOST, OUTBOUND_MSG, INBOUND_MSG, TOKEN_ENDPOINT, WSS_HOST } from '../../consts';

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
  const socketRef = useRef(null);
  selectedConvoRef.current = selectedConvo;
  currUserRef.current = curUser;
  const dispatch = useDispatch();

  // callback used to dispatch new messages if the message is to the current conversation
  const msgCallback = (msg, selectedConvo) => {
    // Add the message to the current convo if displayed
    if(msg.conversation.sid === selectedConvo.sid) {
      console.log('curUser, msg.author:', currUserRef.current, msg.author);
      const msgClass = msg.author === currUserRef.current.id ? OUTBOUND_MSG : INBOUND_MSG;
      if (msg.type === 'media') {
          // Get the url and display the img div
          msg.media.getContentTemporaryUrl()
          .then(
            url => {
              const styleClass = msgClass + ' media-message';
              dispatch(addMessage({type: 'media', url: url, key: msg.state.id, style: styleClass, convoId: msg.conversation.sid, author: msg.author, timestamp: msg.dateCreated}));
            },
          )
          .catch(console.error);
      } else {
        dispatch(addMessage({type: 'text', style: msgClass, body: msg.body, key: msg.state.sid, convoId: msg.conversation.sid, author: msg.author, timestamp: msg.dateCreated}));
      }
    // Mark the conversation with the new message as unread
    } else {
      dispatch(setMessageToUnread(msg.conversation.sid));
    } 
    // Send out a notification if the user isn't looking at the app
    if(document.visibilityState === 'hidden' || !document.hasFocus()) {
      const body = msg.body.length > 30 ? msg.body.substring(0,30) + '...' : msg.body;
      const notificationOptions = {
        badge: `${HOST}/fetchItLogo.png`,
        icon: `${HOST}/fetchItLogo.png`,
        body: body
      }
      const notification = new Notification(`New Message from ${msg.author}`, notificationOptions);
      notification.addEventListener('click', window.open(HOST + '/messages'));
    } 
  }

  // When the messages load, determine whether or not the browser has notifications enabled
  useEffect(() => {
    if(Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  })

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

  // Create a websocket to the frontend server
  useEffect(() => {
    if(!curUser.id) return;
    // Create a websocket
    const ws = new WebSocket(WSS_HOST + `?id=${curUser.id}`);
    // Attach the handlers
    ws.addEventListener('message', msg => {
      // Handle the message
      console.log(msg);
    })
    ws.addEventListener('open', () => {
      console.log('socket to frontend server opened!');
    })
    ws.addEventListener('close', () => {
      console.log('socket to frontend server closed');
    })
  }, [curUser]);

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
