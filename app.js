// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  const messageElement = document.getElementById('api-message');
  const apiUrl = 'https://api.ulti-bot.com';

  // Fetch data from the backend
  fetch(apiUrl, {
    // 'include' is required to handle cookies and sessions later on
    credentials: 'include' 
  })
  .then(response => {
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.text(); // Get the response body as text
  })
  .then(data => {
    // Update the HTML element with the data from the API
    messageElement.textContent = data;
  })
  .catch(error => {
    // If an error occurs, log it and display an error message
    console.error('Error fetching from API:', error);
    messageElement.textContent = 'Failed to connect to the API.';
    messageElement.style.color = 'red';
  });
});