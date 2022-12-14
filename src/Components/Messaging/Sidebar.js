/********************************************************************************
* Author: Bryce Check
* Date: 08/20/2022
* File: Sidebar.js
* Desc: File containing JSX and funcitonality code to create the sidebar for
*    Schultz Technologies messaging service.
********************************************************************************/

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Card, ListGroup, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faArrowLeft, faArrowRight,
         faEdit } from '@fortawesome/free-solid-svg-icons';

import { selectConversation } from '../../Reducers/messagingReducer';

import './Sidebar.css';

function SidebarContactListItem(props) {

  const currConvoId = useSelector(state => state.messaging.selectedConvo ? state.messaging.selectedConvo.sid : null);
  const isRead = useSelector(state => {
    const isConvoRead = state.messaging.conversations ? state.messaging.conversations.find(convo => convo.sid === props.sid).isRead : true;
    return isConvoRead;
  });
  const dispatch = useDispatch();

  return (
    <ListGroup.Item className="convo-selection" onClick={() => {
      if (props.sid !== currConvoId) {
        dispatch(selectConversation({title: props.initials, sid: props.sid, isRead: true}));
      }
    }}>
      <Col>
        <div className='sidebar-initials-label' style={{fontWeight: isRead ? 'normal' : 'bold'}}>
          {props.initials}
        </div>
      </Col>
    </ListGroup.Item>
  );
}

function Sidebar(props) {

  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const conversations = useSelector((state => { return state.messaging.conversations }));
  const navigate = useNavigate();

  return (
    <Card>
      <Card.Body>
        <Card.Title>
          <div className='sidebar-container'>
            <img src='/fetchItLogo.png' alt='Profile Picture' className='logo'/>
            <div className='sidebar-title'>
              <button className='rounded-button spaced' onClick={() => setCollapsed(!collapsed)}>
                <FontAwesomeIcon icon={collapsed ? faArrowRight : faArrowLeft}/>
              </button>
              <button className='rounded-button spaced' onClick={() => navigate('/profile')}>
                <FontAwesomeIcon icon={faCog}/>
              </button>
              <button className='rounded-button spaced' onClick={() => {
                dispatch(selectConversation(null))
              }}>
                <FontAwesomeIcon icon={faEdit}/>
              </button>
            </div>
          </div>
        </Card.Title>
        <ListGroup className='sidebar-list'>
          {conversations.map(convo => {
            console.log('Conversation:', convo);
            return <SidebarContactListItem
              initials={convo.title}
              collapsed={collapsed}
              sid={convo.sid}
              key={convo.sid}
            />;
          })}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}

export default Sidebar;
