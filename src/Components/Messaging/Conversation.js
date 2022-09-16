/*********************************************************************************
* Author: Bryce Check
* Date: 08/21/2022
* File: Conversation.js
* Desc: File which contains the interface for a CSR to message back and forth
*    with any customer who texts them.
*********************************************************************************/

import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faPaperclip, faPaperPlane,
         faSms, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

import { selectConversation, newConversation } from '../../Reducers/messagingReducer';
import { TWILIO_NUMBER, MAX_FILE_SIZE, ALLOWABLE_FILE_EXTENSIONS,
         MAX_MESSAGE_LENGTH } from '../../consts';

import './Conversation.css';

const inboundMsg = 'inbound-message';
const outboundMsg = 'outbound-message';

function Conversation(props) {

  const destinationRef = useRef(null);
  const fileUploadRef = useRef(null);
  const [title, setTitle] = useState(null);
  const [conversationStatusMessage, setConversationStatusMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileRow, setFileRow] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatTypeIcon, setChatTypeIcon] = useState(null);
  const [convo, setConvo] = useState(null);
  const convoData = useSelector(state => state.messaging.selectedConvo);
  const dispatch = useDispatch();

  // Handles checking file for extensions, size, formatting and sets status message if needed
  const checkFile = (file) => {
    // Check the file size
    if(file.size > MAX_FILE_SIZE) {
      setConversationStatusMessage('File too large. Max file size is 16 MB');
      return false;
    }
    // Check the file name format
    const nameArray = file.name.split('.');
    if(nameArray.length !== 2) {
      setConversationStatusMessage('Incorrect file format: "file name"."extension" is the only allowable format');
      return false;
    }
    // check the file extensions
    const allowableExtension = ALLOWABLE_FILE_EXTENSIONS.find(ext => ext === nameArray[1]);
    if (!allowableExtension) {
      setConversationStatusMessage('Only allowable file extensions are ' + ALLOWABLE_FILE_EXTENSIONS.join(', '));
      return false;
    }
    return true;
  }

  useEffect(() => {
    // Check to see if the photo was removed
    if(!selectedFile) {
      fileUploadRef.current.value = null; // Hanldes uploading and deleting the same file multiiple times
      setFileRow(null);
      return;
    }
    // Create a JSX component that has a link to a picture modal, thumbnail, and delete button
    const imgSrc = URL.createObjectURL(selectedFile);
    setFileRow(<div className='conversation-file-row'>
      <div className='image-metadata-container'>
        <img height="20px" src={imgSrc} alt='img' className='conversation-img-thumbnail'/>
        <div className='conversation-image-link'>{selectedFile.name}</div>
      </div>
      <FontAwesomeIcon onClick={() => setSelectedFile(null)}icon={faCircleXmark} className='conversation-img-delete-button'/>
    </div>);
  }, [selectedFile]);

  // Hanldes the logic behind file uploads
  const handleFileUpload = (event) => {
    if (event.target.files.length === 0 ) return;
    const file = event.target.files[0];
    if (!checkFile(file)) return;
    // Set the file status
    setSelectedFile(file);
    setConversationStatusMessage('');
  }

  // An effect to get the right conversation once props or convoData change
  useEffect(() => {
    console.log('rendering messages in conversation');
    if (props.client.current === null || convoData === null) {
      setMessages([]);
      setConvo(null);
    } else {
      console.log(convoData.sid);
      props.client.current.getConversationBySid(convoData.sid)
      .then(convo => {
        setConvo(convo);
      });
    }
  }, [props.client, convoData]);

  // An effect to render the messages and title of the conversation component
  useEffect(() => {
    const fetchMessages = () => {
      if(convo === null) {
        setTitle(null);
        return null;
      }
      // Get the participants
      convo.getParticipants()
      .then(participants => {
        const newDestination = destinationRef.current ? destinationRef.current.value : '';
        const destination = participants.find(participant => participant.type !== 'chat');
        const newTitle = destination ? destination.state.bindings.sms.address : newDestination;
        setTitle(newTitle);
        return convo.getMessages();
      })
      // Get the messages
      .then(msgPaginator => {
        const msgs = msgPaginator.items.map(msg => {
          if (msg.type === 'media') {
            return msg.media.getContentTemporaryUrl();
          } else {
            return msg;
          }
        })
        const classNames = msgPaginator.items.map(msg => {
          return msg.author === 'schultz' ? outboundMsg : inboundMsg;
        });
        return Promise.all([...msgs, ...classNames]);
      })
      .then(msgs => {
        const msgDivs = [];
        const classNamesIdx = msgs.length / 2;
        for(var i = 0; i < msgs.length / 2; i++) {
          const msg = msgs[i];
          const msgClass = msgs[classNamesIdx + i];
          if (typeof(msg) === 'string' && ![inboundMsg, outboundMsg].includes(msg)) {
            msgDivs.push(<img src={msg} alt='msg not displayed' className={msgClass + ' media-message'}/>);
          } else {
            msgDivs.push(<div className={msgClass}>{msg.body}</div>);
          }
        }
        setMessages(msgDivs);
      });
    }
    fetchMessages();
    if(!convo) return;
    convo.on('messageAdded', msg => {
      processNewMessage(msg);
    });
    if(message) {
      sendMessage();
    }
  }, [convo]);

  const processNewMessage = (msg) => {
    const msgClass = msg.author === 'schultz' ? outboundMsg : inboundMsg;
    if (msg.type === 'media') {
      // Get the url and display the img div
      msg.media.getContentTemporaryUrl()
      .then(url => {
        const imgTag = <img src={url} alt='Media Message Format not allwed' className={msgClass + ' media-message'}/>
        setMessages((msgs) => [...msgs, imgTag]);
      });
    } else {
      const msgJsx = <div className={msgClass}>{msg.body}</div>;
      setMessages((msgs) => [...msgs, msgJsx]);
    }
  }

  const sendMessage = () => {
    if(convo === null) return;
    // Check the length of the message
    if (message.length > MAX_MESSAGE_LENGTH) {
      setConversationStatusMessage('Max message length is:', MAX_MESSAGE_LENGTH, 'words.');
    } else {
      convo.sendMessage(message);
    }
    setMessage('');
    // Send the media message if it exists message
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    convo.sendMessage(formData);
    // Reset the state
    setSelectedFile(null);
    fileUploadRef.current.value = null;
  }

  return (
    <Card className='convo-holder'>
      <Card.Header>
        <div className='header'>
          {title ? title : <input ref={destinationRef} placeholder="Destination..." className='destination-text-input'/>}
          <div className='convo-type-container'>
            <FontAwesomeIcon icon={faSms} className='sms-icon' size='xl'/>
            <FontAwesomeIcon icon={faEnvelope} className='email-icon' size='xl'/>
            <FontAwesomeIcon icon={faWhatsapp} className='whatsapp-icon' size='xl'/>
          </div>
          <button className='convo-leave-button' disabled={!convo} onClick={() => {
            convo.delete();
            dispatch(selectConversation(null));
          }}>
            <FontAwesomeIcon icon={faCircleXmark} className='convo-leave-button-icon'/>
          </button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className='msg-holder'>
          {/* Display all the messages in the conversation for each party */}
          {messages ? messages : <div className='convo-holder'>No messages sent yet...</div>}
        </div>
      </Card.Body>
      <Card.Footer>
        {/* Display a text input for the user to be able to send out a text message */}
        <div className='convo-input-container'>
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message..." className="convo-text-input"/>
          <button className='convo-send-button' onClick={() => {
            if (convo === null) {
              const destination = destinationRef.current.value;
              //Check to see if the conversation already exists
              props.client.current.getConversationByUniqueName(destination)
              .then(convo => {
                return convo;
              // If the conversation isn't found, create a new one
              }, _ => {
                return props.client.current.createConversation({
                  friendlyName: destination,
                  uniqueName:   destination
                })
              })
              // Add the messages listener and join the conversation
              .then(convo => {
                convo.on('messageAdded', msg => {
                  processNewMessage(msg);
                });
                return convo.join();
              })
              .then(convo => {
                // Do error checking to make sure the phone number is valid
                convo.addNonChatParticipant(TWILIO_NUMBER, destination);
                return convo;
              })
              .then(convo => {
                sendMessage();
                const convoData = {sid: convo.sid, title: destination};
                dispatch(newConversation(convoData));
              })
            } else {
              sendMessage();
            }
          }}>
            <FontAwesomeIcon icon={faPaperPlane}/>
          </button>
          {/* Create a hidden file input that is triggered by a button click */}
          <input type="file" ref={fileUploadRef} className="convo-file-upload" onChange={(event) => handleFileUpload(event)}/>
          <button className='convo-attach-content' onClick={() => fileUploadRef.current.click()}>
            <FontAwesomeIcon icon={faPaperclip}/>
          </button>
        </div>
        <div className='conversation-state-container'>
          {fileRow}
          <div className='conversation-status-container'>
            {conversationStatusMessage}
          </div>
        </div>
      </Card.Footer>
    </Card>
  );
}

export default Conversation;
