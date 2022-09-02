/*********************************************************************************
* Author: Bryce Check
* Date: 08/21/2022
* File: Conversation.js
* Desc: File which contains the interface for a CSR to message back and forth
*    with any customer who texts them.
*********************************************************************************/

import { useSelector } from 'react-redux';
import { Card, ListGroup } from 'react-bootstrap';

import { TWILIO_NUMBERS } from '../../consts';

const inboundMsg = 'inbound-message';
const outboundMsg = 'outbound-message';

function Conversation(props) {
  const convo = useSelector(state => state.messaging.selectedConvo);

  return (
    <Card>
      <ListGroup>
        {/* Display all the messages in the conversation for each party */}
        {convo.messages ? convo.messages.map(msg => {
            let msgClass = TWILIO_NUMBERS.includes(msg.sender) ? outboundMsg : inboundMsg;
            return <ListGroup.Item className={msgClass}>msg.text</ListGroup.Item>
          })
        :
          <div className='convo-holder'>No messages sent yet...</div>
        }
      </ListGroup>
      {/* Display a text input for the user to be able to send out a text message */}
      <div className='convo-input-container'>
        <input placeholder="Message..." className="convo-text-input"/>
        <button className='convo-send-button'>Send</button>
      </div>
    </Card>
  );
}

export default Conversation;
