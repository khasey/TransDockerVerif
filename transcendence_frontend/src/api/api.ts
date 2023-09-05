import axios from 'axios';

export const fetchUser = async () => {
  try {
    const response = await axios.get('http://localhost:4000/user', { withCredentials: true });
    if (response.data) {
      return response.data;
    } else {
      // Redirection si l'utilisateur n'est pas authentifié
      window.location.href = '/';
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    window.location.href = '/';
    return null;
  }
};
