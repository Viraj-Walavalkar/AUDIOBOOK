import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true
});

// PDF Upload
export const uploadPDF = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/upload-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Get Dialogues
export const getDialogues = async (text: string) => {
  return api.post('/get-dialogues', { text });
};

// Generate Audio
export const generateAudio = async (text: string) => {
  return api.post('/generate-audio', { text }, {
    headers: {
      'Content-Type': 'application/json'
    },
    responseType: 'blob'
  });
};
