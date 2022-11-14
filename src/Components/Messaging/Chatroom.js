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
import { parseName } from '../../utils';

import { initialize, newConversation, leaveConversation, addMessage, setMessageToUnread } from '../../Reducers/messagingReducer';

import './Chatroom.css';
import axios from 'axios';

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
    var conversations;
    const tokenURL = HOST + TOKEN_ENDPOINT;
    fetch(tokenURL, {
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
      client.current.on("conversationAdded", convo => {
        axios.get(`${HOST}/phone-client?number=${convo.friendlyName.slice(2)}`)
        .then(
          res => {
            var title = parseName(res.data.FirstName, res.data.LastName);
            title = title ? title : convo.uniqueName;
            dispatch(newConversation({sid: convo.sid, title: title, isRead: true}));
          },
          err => console.error(`Error while retrieving phone client name for new conversation: ${err}`)
        );
      })
      client.current.on("conversationJoined", convo => {
        console.log('conversation joined');
        axios.get(`${HOST}/phone-client?number=${convo.friendlyName.slice(2)}`)
        .then(
          res => {
            var title = parseName(res.data.FirstName, res.data.LastName);
            title = title ? title : convo.uniqueName;
            dispatch(newConversation({sid: convo.sid, title: title, isRead: true}));
          },
          err => console.error(`Error while retrieving phone client name for new conversation: ${err}`)
        );
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
    // Get the name of the participant in the conversation
    .then(
      convos => {
        conversations = convos.items;
        return Promise.all(
          convos.items.map(convo => axios.get(`${HOST}/phone-client?number=${convo.friendlyName.slice(2)}`))
        )
      },
      err => console.error(`Error while getting subscribed conversations: ${err}`)
    )
    .then(
      vals => {
        const convoData = [];
        for(var i = 0; i < conversations.length; i++) {
          const convo = conversations[i];
          var title = parseName(vals[i].data.FirstName, vals[i].data.LastName);
          title = title ? title : convo.uniqueName;
          convoData.push({
            sid: convo.sid,
            title: title,
            isRead: true
          });
        }
        dispatch(initialize(convoData));
      },
      err => console.error(`Error while forming sidebar: ${err}`)
    )
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
