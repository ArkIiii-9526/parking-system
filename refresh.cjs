const axios = require('axios');
axios.post('http://localhost:8076/api/auth/login', {username: 'admin', password: 'admin123'})
  .then(res => {
    const token = res.data.data.token;
    return axios.post('http://localhost:8076/api/sys/permission/refresh', {}, {headers: {'Authorization': 'Bearer ' + token}});
  })
  .then(res => {
    console.log('Cache refresh response:', res.data);
  })
  .catch(err => console.error(err.message));