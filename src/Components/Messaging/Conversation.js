/********************************************************************************************************
* Author: Bryce Check
* Date: 08/21/2022
* File: Conversation.js
* Desc: File which contains the interface for a CSR to message back and forth with any customer who 
*   texts them. CSR's can also leave, delete, and share conversations depending upon permissions/roles.
*
* TODO: 
* - create a database connection
* - create webhooks to suspend usage when messages exceed rate limits
* - create tooltip overlays for the different buttons
********************************************************************************************************/

// node module imports
import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faPaperclip, faPaperPlane,
         faSms, faEnvelope, faSignOut, faShare } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import axios from 'axios';

// home brewed imports
import ListSelectModal from './ListSelectModal'
import { selectConversation, setMessages, addPreviousMessages, leaveConversation } from '../../Reducers/messagingReducer';
import { MAX_FILE_SIZE, ALLOWABLE_FILE_EXTENSIONS,
         MAX_MESSAGE_LENGTH, 
         OUTBOUND_MSG,
         INBOUND_MSG,
         MESSAGE_BLOCK_SIZE,
         HOST} from '../../consts';

import './Conversation.css';
import { useGetCurrentUser } from './Hooks';

// Joins existing conversation or creates new one if no conversation between client and customer exists already
const joinConversation = (destination, client, setStatus) => {
  // Check to see if the conversation already exists
  axios.post(HOST + '/join-convo', {destination:destination})
  // Join the conversation on the backend
  .then(
    res => {
      if (res.status < 200 || res.status >= 300) {
        throw(new Error(`Bad status from join-convo request: ${res.status}`));
      } else {
        return client.peekConversationBySid(res.data.sid);
      }
    },
    err => {
      setStatus(`Error occured while requesting to join the conversation with: ${destination}`);
      console.log(err);
    }
  )
  .then(
    convo => convo.join(),
    err => {
      setStatus('Error occurred while retrieving conversation data');
      console.error(err);
    }
  )
  .catch(console.error);
}

// Share the conversation with a different user and leave
const shareConversation = (convo, dispatch, setDisplay) => {
  return (identity, setStatus, currUser) => {
    // Find the twilioId of the current user
    console.log(identity);
    convo.getParticipants().then(
      participants => {
        const currParticipant = participants.find(participant => {
          console.log(participant.identity, currUser);
          return participant.identity === currUser.id;
        });
        console.log(currParticipant);
        return currParticipant.sid;
      },
      err => console.error('Could not get conversation participants:', err)
    )
    // Request the backend to transfer the conversation
    .then(
      sid => axios.post(HOST + '/transfer-conversation', {convoId: convo.sid, identity: identity, currUserTwilioId: sid}),
      err => console.error('Could not get current user twilio ID:', err)
    )
    .then(
      // Leave the conversation
      res => {
        if(res.status >= 200 && res.status < 300) {
          convo.leave();
        } else {
          throw(new Error(`Bad request to transfer conversation: ${res.status}`));
        }
      }
    )
    .then(
      // Update the UI after successfully leaving and sharing conversation
      _ => {
        dispatch(leaveConversation(convo))
        setDisplay(false);
      },
      err => {
        setStatus('Error occurred while transferring the conversation!');
        console.log(err);
      })
    .catch(console.error);
  }
}

// used to handle logic of fetching previous messages if they exist
const detectScrollToTopOfMessages = (e, convo, lastMessageIndex, dispatch, currUser) => {
  const top = e.target.scrollTop === 0;
  if (top && lastMessageIndex !== 0) {
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
        return msg.author === currUser.id ? [OUTBOUND_MSG, msg.state.sid, msg.state.index] : [INBOUND_MSG, msg.state.sid, msg.state.index];
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
      dispatch(addPreviousMessages(msgDivs));
    })
    .catch(console.error);
  }
}

// Handles checking file for extensions, size, formatting and sets status message if needed
const checkFile = (file, setStatus) => {
  // Check the file size
  if(file.size > MAX_FILE_SIZE) {
    setStatus('File too large. Max file size is 16 MB');
    return false;
  }
  // Check the file name format
  const nameArray = file.name.split('.');
  if(nameArray.length !== 2) {
    setStatus('Incorrect file format: "file name"."extension" is the only allowable format');
    return false;
  }
  // check the file extensions
  const allowableExtension = ALLOWABLE_FILE_EXTENSIONS.find(ext => ext === nameArray[1]);
  if (!allowableExtension) {
    setStatus('Only allowable file extensions are ' + ALLOWABLE_FILE_EXTENSIONS.join(', '));
    return false;
  }
  return true;
}

// Hanldes the logic behind file uploads
const handleFileUpload = (event, setStatus, setSelectedFile) => {
  if (event.target.files.length === 0 ) return;
  const file = event.target.files[0];
  if (!checkFile(file, setStatus)) return;
  // Set the file status
  setSelectedFile(file);
  setStatus('');
}

const sendMessage = (convo, message, file, setStatus, setMessage, setFile, fileRef) => {
  // If the convo is null then this is a new message to a new conversation
  if(convo === null) return;
  // Check the length of the message
  if (message.length > MAX_MESSAGE_LENGTH) {
    setStatus('Max message length is:', MAX_MESSAGE_LENGTH, 'words.');
  } else if (message.length !== 0) {
    convo.sendMessage(message);
  }
  setMessage('');
  // Send the media message if it exists message
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  convo.sendMessage(formData);
  // Reset the state
  setFile(null);
  fileRef = null;
  setStatus('');
}

function Conversation(props) {

  const destinationRef = useRef(null);
  const fileUploadRef = useRef(null);
  const lastElementRef = useRef(null);
  const tooltipRef = useRef(null);
  const deleteBtnRef = useRef(null);
  const shareBtnRef = useRef(null);
  const currUser = useGetCurrentUser();
  const [title, setTitle] = useState(null);
  const [displayModal, setDisplayModal] = useState(false);
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
      if (msg.type === 'media') {
        msgs.push(<img src={msg.url} alt='Media Message Format not allwed' key={msg.key} className={msg.style} ref={lastElementRef}/>);
      } else {
        msgs.push(<div className={msg.style} key={msg.key} ref={lastElementRef}>{msg.body}</div>);
      }
    }
    return msgs;
  });
  const dispatch = useDispatch();

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

  // An effect to get the right conversation once props or convoData change
  useEffect(() => {
    if (props.client.current === null || convoData === null) {
      dispatch(setMessages([]));
      setConvo(null);
    } else {
      props.client.current.getConversationBySid(convoData.sid)
      .then(convo => {
        setConvo(convo);
      })
      .catch(console.error);
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
          return msg.author === currUser.id ? [OUTBOUND_MSG, msg.state.sid, msg.state.index] : [INBOUND_MSG, msg.state.sid, msg.state.index];
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
      })
      .catch(console.error);
    }
    fetchMessages();
    if(message) {
      sendMessage(convo, message, selectedFile, setConversationStatusMessage, setMessage, setSelectedFile, fileUploadRef.current);
    }
  }, [convo]);

  useEffect(() => {
    if(!lastElementRef.current) return;
    lastElementRef.current.scrollIntoView({behavior: 'smooth', block: 'end'});
  }, [messages])

  // Create the instances of handlers
  const boundHandleShare = shareConversation(convo, dispatch, setDisplayModal);

  return (<>
    <ListSelectModal
      display={displayModal}
      setParentDisplay={() => setDisplayModal(false)}
      handleAccept={boundHandleShare}
    />
    <Card className='convo-holder'>
      <Card.Header>
        <div className='header'>
          {title ? title : <input ref={destinationRef} placeholder="Destination..." className='destination-text-input'/>}
          <div className='convo-type-container'>
            <FontAwesomeIcon icon={faSms} className='sms-icon' size='xl'/>
            <FontAwesomeIcon icon={faEnvelope} className='email-icon' size='xl'/>
            <FontAwesomeIcon icon={faWhatsapp} className='whatsapp-icon' size='xl'/>
          </div>
          <div className='convo-action-button-container'>
            <button className='convo-share-button' disabled={!convo} onClick={() => {setDisplayModal(true)}}>
              <FontAwesomeIcon icon={faShare} className='convo-share-button-icon'/>
            </button>
            <button className='convo-leave-button' disabled={!convo} onClick={() => {
              convo.leave();
              dispatch(selectConversation(null));
            }}>
              <FontAwesomeIcon icon={faSignOut} className='convo-leave-button-icon'/>
            </button>
            <button className='convo-delete-button' disabled={!convo} onClick={() => {
              convo.delete();
              dispatch(selectConversation(null));
            }}>
              <FontAwesomeIcon icon={faCircleXmark} className='convo-delete-button-icon'/>
            </button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        <div className='msg-holder' onScroll={e => {detectScrollToTopOfMessages(e, convo, lastMessageIndex, dispatch, currUser)}}>
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
              joinConversation(destinationRef.current.value, props.client.current, setConversationStatusMessage);
            } else {
              sendMessage(convo, message, selectedFile, setConversationStatusMessage, setMessage, setSelectedFile, fileUploadRef.current);
            }
          }}>
            <FontAwesomeIcon icon={faPaperPlane}/>
          </button>
          {/* Create a hidden file input that is triggered by a button click */}
          <input type="file" ref={fileUploadRef} className="convo-file-upload" onChange={(event) => handleFileUpload(event, setConversationStatusMessage, setSelectedFile)}/>
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
  </>);
}

export default Conversation;
