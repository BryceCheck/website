/*********************************************************************
* Author: Bryce Check, 08/20/2022
* File: Chatroom.js
* Desc: Chatroom page for messaging between clients in a web platform
*    that has a collapsable sidebar and a chat area.
**********************************************************************/

import {Container, Row, Col} from 'react-bootstrap';

import Navbar from '../Navbar/Navbar';
import Sidebar from './Sidebar';
import Conversation from './Conversation';

import './conversation.css';

function Chatroom(props) {
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
