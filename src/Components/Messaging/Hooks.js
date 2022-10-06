import axios from "axios"
import { useState, useEffect } from 'react';
import { HOST } from "../../consts";

export const useGetCurrentUser = () => {
  const [userInfo, setUserInfo] = useState({id: ''});

  useEffect(() => {
    axios.get(HOST + '/user-info')
    .then(
      res => setUserInfo(res.data.userInfo)
    )
    .catch(console.error);
  }, [])

  return userInfo;
}