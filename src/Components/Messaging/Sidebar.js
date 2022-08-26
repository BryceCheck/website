/********************************************************************************
* Author: Bryce Check
* Date: 08/20/2022
* File: Sidebar.js
* Desc: File containing JSX and funcitonality code to create the sidebar for
*    Schultz Technologies messaging service.
********************************************************************************/

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, ListGroup, Col, Stack } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

function SidebarContactListItem(props) {
  return (
    <ListGroup.Item>
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

  const [collapsed, setCollapsed] = useState(false);
  const conversations = useSelector((state => state.conversations));

  console.log(conversations);

  return (
    <Card>
      <Card.Body>
        <Card.Title>
          <button className='sidebar-collapse-button' onClick={() => setCollapsed(!collapsed)}>
            <FontAwesomeIcon icon={collapsed ? faArrowRight : faArrowLeft}/>
          </button>
          <button className='sidebar-settings-button'>
            <FontAwesomeIcon icon={faCog}/>
          </button>
        </Card.Title>
        <ListGroup>
          {conversations.map(convo => {
            var initials;
            const names = convo.name.split();
            if (names.length === 1) {
              initials = names[0][0];
            } else if (names.length === 2) {
              initials = names[0][0] + names[1][0];
            } else {
              initials = '??';
            }
            return <SidebarContactListItem
                 initials={initials}
                 collapsed={collapsed}
                 number={convo.number}
                 messages={convo.messages}
               />;
          })}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}

export default Sidebar;
