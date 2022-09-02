/*********************************************************************
* Author: Bryce Check, 08/20/2022
* File: Chatroom.js
* Desc: Chatroom page for messaging between clients in a web platform
*    that has a collapsable sidebar and a chat area.
**********************************************************************/

import { useEffect, useState } from 'react';
import {Container, Row, Col} from 'react-bootstrap';
import { Client as ConversationsClient } from '@twilio/conversations';

import Navbar from '../Navbar/Navbar';
import Sidebar from './Sidebar';
import Conversation from './Conversation';
import { HOST, API_PORT } from '../../consts';


import './conversation.css';

function Chatroom(props) {
  
  // Set the state of the function
  const [token, setToken] = useState('');
  // placeholder for conversationsclient which is initialized after
  // the component has mounted and the token has been retrieved
  var client; 
  

  // When the comonent mounts, retrieve a backend token
  useEffect(() => {
    const tokenURL = HOST + ':' + API_PORT + '/access-token';
    fetch(tokenURL)
    .then(res => {
      res.json();
    })
    // Initialize the chat client
    .then(data => {
      setToken(data.accessToken);
    })
  }, []);

  // Use the state to initialize the conversations client websocket
  if(token) {
    client = ConversationsClient(token);
  }

  return (<>
    <Navbar/>
    <Container fluid className='messaging-container'>
      <Row xs='2'>
        <Col xs='4' md='2'>
          <Sidebar/>
        </Col>
        <Col xs='8' md='10'>
          <Conversation/>
        </Col>
      </Row>
    </Container>
  </>);
}

export default Chatroom;
