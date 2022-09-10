/********************************************************************************
* Author: Bryce Check
* Date: 08/20/2022
* File: Sidebar.js
* Desc: File containing JSX and funcitonality code to create the sidebar for
*    Schultz Technologies messaging service.
********************************************************************************/

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, ListGroup, Col, Stack } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faArrowLeft, faArrowRight,
         faEdit } from '@fortawesome/free-solid-svg-icons';

import { selectConversation } from '../../Reducers/messagingReducer';

import './Sidebar.css';

function SidebarContactListItem(props) {

  const dispatch = useDispatch();

  return (
    <ListGroup.Item className="convo-selection" onClick={() => {
      dispatch(selectConversation({sid: props.sid}));
    }}>
      <Col>
        <div className='sidebar-initials-label'>
          {props.initials}
        </div>
      </Col>
      { props.collapsed ? <>
        <Col>
          <Stack>
            <div className='sidebar-phone-number'>
              {props.number}
            </div>
            <div className='sidebar-message-preview'>
              {props.messages[props.messages.length - 1]}
            </div>
          </Stack>
        </Col>
        <Col>
          <div className="sidebar-message-time">
            {props.messages[props.messages.length - 1].timestamp}
          </div>
        </Col>
      </>
      : <></>}
    </ListGroup.Item>
  );
}

function Sidebar(props) {

  const dispatch = useDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const conversations = useSelector((state => { return state.messaging.conversations }));

  return (
    <Card>
      <Card.Body>
        <Card.Title>
          <div className='sidebar-title'>
            <button className='sidebar-collapse-button' onClick={() => setCollapsed(!collapsed)}>
              <FontAwesomeIcon icon={collapsed ? faArrowRight : faArrowLeft}/>
            </button>
            <button className='sidebar-settings-button'>
              <FontAwesomeIcon icon={faCog}/>
            </button>
            <button className='sibebar-new-msg-button' onClick={() => {
              dispatch(selectConversation(null))
            }}>
              <FontAwesomeIcon icon={faEdit}/>
            </button>
          </div>
        </Card.Title>
        <ListGroup>
          {conversations.map(convo => {
            var initials;
            const names = convo.title.split();
            if (names.length === 1) {
              initials = convo.title;
            } else if (names.length === 2) {
              initials = names[0][0] + names[1][0];
            } else {
              initials = '??';
            }
            return <SidebarContactListItem
              initials={initials}
              collapsed={collapsed}
              messages={convo.messages}
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
