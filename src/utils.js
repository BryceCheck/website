import axios from "axios";

import { MAX_NAME_LENGTH, MAX_PHONE_NUMBER_LENGTH } from "./consts";

export const parseName = (first, last) => {
    var title;
    if(first && last) {
      title = `${first} ${last}`
    } else if(first && !last) {
      title = `${first}`
    } else {
      title = '';
    }
    return title;
};

const handleNameChange = (e, key, setCustomerInfo, setError) => {
  if(e.target.value.length > MAX_NAME_LENGTH) {
    return setError('Please enter a name less than 50 letters long.');
  }
  if(!/^[a-zA-Z() ]*$/.test(e.target.value)) {
    return setError('Please enter only alphabetical characters');
  }
  console.log('changing name state');
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

export const handleFieldChange = (e, key, setCustomerInfo, setError) => {
  if (['FirstName', 'LastName'].includes(key)) {
    handleNameChange(e, key, setCustomerInfo, setError);
  } else if (['HomePhone', 'CellPhone'].includes(key)) {
    handleNumberChange(e, key, setCustomerInfo, setError);
  }
}