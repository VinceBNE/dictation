// Function to load words from CSV URL
function loadWordsFromCSV(url) {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load CSV');
      }
      return response.text();
    })
    .then(data => {
      return data.split(',').map(word => word.trim()); // Split CSV by commas and trim whitespace
    });
}

// Load words from input or CSV URL
document.getElementById('loadWords').addEventListener('click', () => {
  const wordInput = document.getElementById('wordInput').value.trim();
  const csvUrlInput = document.getElementById('csvUrlInput').value.trim();
  const wordList = document.getElementById('wordList');
  const loadingSpinner = document.getElementById('loadingSpinner');

  wordList.innerHTML = ''; // Clear previous list
  loadingSpinner.style.display = 'flex'; // Show loading spinner

  let words = [];

  if (wordInput) {
    words = wordInput.split(',').map(word => word.trim()); // Load from text input
    loadingSpinner.style.display = 'none'; // Hide loading spinner
    displayWords(words);
  } else if (csvUrlInput) {
    loadWordsFromCSV(csvUrlInput)
      .then(words => {
        displayWords(words);
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        alert('Failed to load CSV. Please check the URL and try again.');
      })
      .finally(() => {
        loadingSpinner.style.display = 'none'; // Hide loading spinner
      });
  } else {
    alert('Please enter words or a CSV URL.');
    loadingSpinner.style.display = 'none'; // Hide loading spinner
  }
});
