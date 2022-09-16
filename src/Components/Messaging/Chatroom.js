/*********************************************************************
* Author: Bryce Check, 08/20/2022
* File: Chatroom.js
* Desc: Chatroom page for messaging between clients in a web platform
*    that has a collapsable sidebar and a chat area.
**********************************************************************/

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {Container, Row, Col} from 'react-bootstrap';
import { Client as ConversationsClient } from '@twilio/conversations';

import Navbar from '../Navbar/Navbar';
import Sidebar from './Sidebar';
import Conversation from './Conversation';
import { HOST, API_PORT } from '../../consts';

import { initialize, newConversation, leaveConversation } from '../../Reducers/messagingReducer';

import './Chatroom.css';

function Chatroom(props) {
  // placeholder for conversationsclient which is initialized after
  // the component has mounted and the token has been retrieved
  const client = useRef(null);
  const dispatch = useDispatch();

  // When the comonent mounts, retrieve a backend token
  useEffect(() => {
    const tokenURL = HOST + ':' + API_PORT + '/access-token';
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
        const convoData = {sid: convo.sid, title: convo.friendlyName ? convo.friendlyName : ''};
        dispatch(newConversation(convoData));
      });
      client.current.on("conversationLeft", convo => {
        const convoData = {sid: convo.sid, title: convo.friendlyName ? convo.friendlyName : ''};
        dispatch(leaveConversation(convoData));
      });
      return client.current.getSubscribedConversations();
    })
    .then(convos => {
      for(var i = 0; i < convos.items.length; i++) {
        if (convos.items[i].channelState.status === 'notParticipating') {
          convos.items[i].delete();
        }
      }
      const convoData = convos.items.map(convo => {
        return {
          sid: convo.sid,
          title: convo.friendlyName ? convo.friendlyName : ''
        };
      });
      dispatch(initialize(convoData));
    });
  }, []);

  return (<div className='chatroom-page'>
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
  </div>);
}

export default Chatroom;
