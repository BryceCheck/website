import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

import './CustomerProfileModal.css';
import { MAX_NAME_LENGTH, MAX_PHONE_NUMBER_LENGTH } from '../../consts';
import { parseName, handleFieldChange } from '../../utils';
import { useDispatch } from 'react-redux';
import { editConversationTitle } from '../../Reducers/messagingReducer';

const KeyToDisplayMap = {
  FirstName: 'First Name',
  LastName: 'Last Name',
  CellPhone: 'Cell Phone',
  HomePhone: 'Home Phone',
}

const getCustomerInformation = (number, setCustomerInfo, setErrorMsg, setIsNew) => {
  // Request the customer information from the backend
  axios.get(`/phone-client?number=${number}`)
  // Return the values of the fields to be displayed on the customer profile
  .then(
    res => {
      for(const [key, val] of Object.entries(res.data)) {
        if(!res.data[key]) continue;
        res.data[key] = val.trim();
      }
      setCustomerInfo(res.data);
    },
    _ => {
      setCustomerInfo({
        'FirstName': '',
        'LastName': '',
        'HomePhone': '',
        'CellPhone': number
      });
      setIsNew(true);
    }
  )
};

const handleProfileChangeSubmit = (customerInfo, convo, setError, setIsEditing, dispatch, onHide) => {
  axios.patch('/phone-client', {...customerInfo})
  .then(
    _ => {
      setError('');
      setIsEditing(false);
      dispatch(editConversationTitle({sid: convo.sid, title: `${customerInfo.FirstName} ${customerInfo.LastName}`}));
      onHide();
    },
    err => {
      console.error(`Error while updating customer info: ${err}`);
      setError('Error while updating customer info. Please try again later.');
    }
  )
}

const handleProfileCreation = (customerInfo, convo, setError, setIsEditing, setIsNew, dispatch, onHide) => {
  axios.post('/phone-client', {
    number: customerInfo.CellPhone,
    firstName: customerInfo.FirstName,
    lastName: customerInfo.LastName
  })
  .then(
    _ => {
      setError('');
      setIsEditing(false);
      setIsNew(false);
      dispatch(editConversationTitle({sid: convo.sid, title: `${customerInfo.FirstName} ${customerInfo.LastName}`}));
      onHide();
    },
    err => {
      setError('Error while creating new phone client! Please try again later!');
      setIsEditing(false);
    }
  )
}

const CustomerProfileModal = (props) => {

  const [customerInfo, setCustomerInfo] = useState({'FirstName': '', 'LastName': '', 'HomePhone': '', 'CellPhone': ''});
  const [isEditing, setIsEditing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [profileBody, setProfileBody] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    if(!props.convo) return;
    getCustomerInformation(props.convo.uniqueName.slice(2), setCustomerInfo, setErrorMsg, setIsNew);
  }, [props.show, props.convo]);

  useEffect(() => {
    if(!customerInfo) return;
    const fields = [];
    for(const [key, val] of Object.entries(customerInfo)) {
      if(!KeyToDisplayMap.hasOwnProperty(key)) continue;
      fields.push(
        <tr className='customer-profile-row'>
          <td className='left-aligned bold title'><label>{KeyToDisplayMap[key]}</label></td>
          {isEditing
          ? <td className='items-left'><input value={val} onChange={e => handleFieldChange(e, key, setCustomerInfo, setErrorMsg)}/></td>
          : <td className='left-aligned'><div onClick={_ => setIsEditing(true)}>{val}</div></td>
          }
        </tr>
      );
    }
    setProfileBody(fields);
  }, [customerInfo, isEditing]);
  
  return (
    <Modal show={props.show} onHide={_ => {
      setErrorMsg('');
      setIsEditing(false);
      props.onHide();
    }} centered>
      <Modal.Header>
        <h1 className='centered-margins'>{customerInfo ? `${parseName(customerInfo.FirstName, customerInfo.LastName)}` : 'Customer'} Profile</h1>
      </Modal.Header>
      <Modal.Body>
        <div className='customer-profile-body-container'>
          <table className='centered-margins'>
            {profileBody}
          </table>
          <div className='profile-error'>{errorMsg}</div>
        </div>
      </Modal.Body>
      <Modal.Footer className=''>
        <button onClick={_ => {
          if(isEditing && !isNew) {
            handleProfileChangeSubmit(customerInfo, props.convo, setErrorMsg, setIsEditing, dispatch, props.onHide);
          } else if (isEditing && isNew) {
            handleProfileCreation(customerInfo, props.convo, setErrorMsg, setIsEditing, setIsNew, dispatch, props.onHide);
          } else if(!isEditing) {
            setIsEditing(true);
          }
        }}>{isEditing ? 'Submit' : 'Edit'}</button>
        <button style={{display: isEditing ? 'block' : 'none'}} onClick={_ => setIsEditing(false)}>Cancel</button>
      </Modal.Footer>
    </Modal>
  )
};

export default CustomerProfileModal;
