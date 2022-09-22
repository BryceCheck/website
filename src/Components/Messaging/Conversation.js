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

import { selectConversation, newConversation, setMessages, addPreviousMessages } from '../../Reducers/messagingReducer';
import { TWILIO_NUMBER, MAX_FILE_SIZE, ALLOWABLE_FILE_EXTENSIONS,
         MAX_MESSAGE_LENGTH, 
         OUTBOUND_MSG,
         INBOUND_MSG,
         MESSAGE_BLOCK_SIZE} from '../../consts';

import './Conversation.css';

function Conversation(props) {

  const destinationRef = useRef(null);
  const fileUploadRef = useRef(null);
  const lastElementRef = useRef(null);
  const [title, setTitle] = useState(null);
  const [conversationStatusMessage, setConversationStatusMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileRow, setFileRow] = useState(null);
  const [message, setMessage] = useState('');
  const [convo, setConvo] = useState(null);
  const lastMessageIndex = useSelector(state => {
    const empty = state.messaging.currentMessages.length === 0;
    return !empty ? state.messaging.currentMessages[0].idx : 0;
  });
  const convoData = useSelector(state => state.messaging.selectedConvo);
  const messages = useSelector(state => {
    const msgs = [];
    for (var i = 0; i < state.messaging.currentMessages.length; i++) {
      const msg = state.messaging.currentMessages[i];
      const ref = i === state.messaging.currentMessages.length - 1 ? lastElementRef : null;
      if (msg.type === 'media') {
        msgs.push(<img src={msg.url} alt='Media Message Format not allwed' key={msg.key} className={msg.style} ref={lastElementRef}/>);
      } else {
        msgs.push(<div className={msg.style} key={msg.key} ref={lastElementRef}>{msg.body}</div>);
      }
    }
    return msgs;
  });
  const dispatch = useDispatch();

  // used to handle logic of fetching previous messages if they exist
  const detectScrollToTopOfMessages = (e) => {
    const top = e.target.scrollTop === 0;
    if (top) {
      // Retrieve the last MESSAGE_BLOCK_SIZE messages from Twilio
      convo.getMessages(MESSAGE_BLOCK_SIZE, lastMessageIndex, 'backwards')
      .then(paginator => {
        // Omit the last message as it is the current first message
        var items = paginator.items.slice(0, paginator.items.length - 1);
        var msgs = [];
        for (var i = 0; i < items.length; i++) {
          const msg = items[i];
          if (msg.type === 'media') {
            msgs.push(msg.media.getContentTemporaryUrl());
          } else {
            msgs.push(msg);
          }
        }
        // pass along the metadata needed in the next step
        const classNames = items.map(msg => {
          return msg.author === 'schultz' ? [OUTBOUND_MSG, msg.state.sid, msg.state.index] : [INBOUND_MSG, msg.state.sid, msg.state.index];
        });
        return Promise.all([...msgs, ...classNames]);
      })
      // Compile media and text message data together and dispatch them to the redux store
      .then(msgs => {
        const msgDivs = [];
        const classNamesIdx = msgs.length / 2;
        for(var i = 0; i < msgs.length / 2; i++) {
          const msg = msgs[i];
          const msgClass = msgs[classNamesIdx + i];
          if (typeof(msg) === 'string' && ![INBOUND_MSG, OUTBOUND_MSG].includes(msg)) {
            const styleClass = msgClass[0] + ' media-message';
            msgDivs.push({type: 'media', url: msg, key: msgClass[1], style: styleClass, idx: msgClass[2]});
          } else {
            msgDivs.push({type: 'text', key: msgClass[1], style: msgClass[0], body: msg.body, idx: msgClass[2]});
          }
        }
        console.log('dispatching previous messages:', msgDivs);
        dispatch(addPreviousMessages(msgDivs));
      });
    }
  }

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

  const sendMessage = () => {
    // If the convo is null then this is a new message to a new conversation
    if(convo === null) return;
    console.log('sending the message');
    // Check the length of the message
    if (message.length > MAX_MESSAGE_LENGTH) {
      setConversationStatusMessage('Max message length is:', MAX_MESSAGE_LENGTH, 'words.');
    } else if (message.length !== 0) {
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
    if (props.client.current === null || convoData === null) {
      dispatch(setMessages([]));
      setConvo(null);
    } else {
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
      // Get the message metadata needed to make the divs
      .then(msgPaginator => {
        const msgs = msgPaginator.items.map(msg => {
          if (msg.type === 'media') {
            return msg.media.getContentTemporaryUrl();
          } else {
            return msg;
          }
        })
        const classNames = msgPaginator.items.map(msg => {
          return msg.author === 'schultz' ? [OUTBOUND_MSG, msg.state.sid, msg.state.index] : [INBOUND_MSG, msg.state.sid, msg.state.index];
        });
        // Must return as promises to get the callback urls to display the media messages
        return Promise.all([...msgs, ...classNames]);
      })
      // Create and dispatch the current messages objects needed to create the react components to display
      .then(msgs => {
        const msgDivs = [];
        const classNamesIdx = msgs.length / 2;
        for(var i = 0; i < msgs.length / 2; i++) {
          const msg = msgs[i];
          const msgClass = msgs[classNamesIdx + i];
          if (typeof(msg) === 'string' && ![INBOUND_MSG, OUTBOUND_MSG].includes(msg)) {
            const styleClass = msgClass[0] + ' media-message';
            msgDivs.push({type: 'media', url: msg, key: msgClass[1], style: styleClass, idx: msgClass[2]});
          } else {
            msgDivs.push({type: 'text', key: msgClass[1], style: msgClass[0], body: msg.body, idx: msgClass[2]});
          }
        }
        dispatch(setMessages(msgDivs));
      });
    }
    fetchMessages();
    if(message) {
      sendMessage();
    }
  }, [convo]);

  useEffect(() => {
    if(!lastElementRef.current) return;
    lastElementRef.current.scrollIntoView({behavior: 'smooth', block: 'end'});
  }, [messages])

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
        <div className='msg-holder' onScroll={detectScrollToTopOfMessages}>
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
              .then(convo => {
                convo.join();
                return convo;
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
