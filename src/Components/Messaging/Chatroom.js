/*********************************************************************
* Author: Bryce Check, 08/20/2022
* File: Chatroom.js
* Desc: Chatroom page for messaging between clients in a web platform
*    that has a collapsable sidebar and a chat area.
**********************************************************************/

import { useEffect, useState, useRef } from 'react';
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
  const client = useRef(null);

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
      setToken(data.accessToken);
      var newClient = new ConversationsClient(data.accessToken);
      client.current = newClient;
      console.log(newClient);
    })
  }, []);

  console.log('rendering');
  return (<>
    <Navbar/>
    <Container fluid className='messaging-container'>
{/*
      <Row xs='2'>
        <Col xs='4' md='2'>
          <Sidebar/>
        </Col>
        <Col xs='8' md='10'>
          <Conversation/>
        </Col>
      </Row>
*/}
    </Container>
  </>);
}

export default Chatroom;
