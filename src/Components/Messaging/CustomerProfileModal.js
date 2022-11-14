import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import axios from 'axios';

import './CustomerProfileModal.css';
import { MAX_NAME_LENGTH, MAX_PHONE_NUMBER_LENGTH } from '../../consts';
import { parseName } from '../../utils';
import { useDispatch } from 'react-redux';
import { editConversationTitle } from '../../Reducers/messagingReducer';

const KeyToDisplayMap = {
  FirstName: 'First Name',
  LastName: 'Last Name',
  CellPhone: 'Cell Phone',
  HomePhone: 'Home Phone',
}

const getCustomerInformation = (number, setCustomerInfo, setErrorMsg) => {
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
    err => {
      setErrorMsg('Cannot get customer information! Please, try again later.');
      console.error(`Error while retrieving customer profile: ${err}`);
    }
  )
};

const handleNameChange = (e, key, setCustomerInfo, setError) => {
  if(e.target.value.length > MAX_NAME_LENGTH) {
    return setError('Please enter a name less than 50 letters long.');
  }
  if(!/^[a-zA-Z() ]*$/.test(e.target.value)) {
    return setError('Please enter only alphabetical characters');
  }
  setError('');
  setCustomerInfo(customerInfo => {
    return {
      ...customerInfo,
      [key] : e.target.value
    };
  })
}

const handleNumberChange = (e, key, setCustomerInfo, setError) => {
  if(!/^\d+$/.test(e.target.value)) {
    return setError(`Pleae enter only numbers. No '-', '(', ')' or spaces.`)
  }
  if(e.target.value.length > MAX_PHONE_NUMBER_LENGTH) {
    return setError('Maximum phone number length is 10. International Numbers not supported yet.')
  }
  setError('');
  setCustomerInfo(prevInfo => {
    return {
      ...prevInfo, 
      [key]: e.target.value
    }
  })
}

const handleFieldChange = (e, key, setCustomerInfo, setError) => {
  if (['FirstName', 'LastName'].includes(key)) {
    handleNameChange(e, key, setCustomerInfo, setError);
  } else if (['HomePhone', 'CellPhone'].includes(key)) {
    handleNumberChange(e, key, setCustomerInfo, setError);
  }
}

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

const CustomerProfileModal = (props) => {

  const [customerInfo, setCustomerInfo] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [profileBody, setProfileBody] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    if(!props.convo) return;
    getCustomerInformation(props.convo.uniqueName.slice(2), setCustomerInfo, setErrorMsg);
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
          isEditing ? handleProfileChangeSubmit(customerInfo, props.convo, setErrorMsg, setIsEditing, dispatch, props.onHide) : setIsEditing(true)
        }}>{isEditing ? 'Submit' : 'Edit'}</button>
        <button style={{display: isEditing ? 'block' : 'none'}} onClick={_ => setIsEditing(false)}>Cancel</button>
      </Modal.Footer>
    </Modal>
  )
};

export default CustomerProfileModal;
