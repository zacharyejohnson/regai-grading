import axios from 'axios';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const instance = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export default instance;