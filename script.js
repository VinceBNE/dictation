let dictationInterval; // Variable to store the interval ID

// Function to speak a word
function speakWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  speechSynthesis.speak(utterance);
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
    words = wordInput.split(',').map(word => word.trim());
    loadingSpinner.style.display = 'none'; // Hide loading spinner
    displayWords(words);
  } else if (csvUrlInput) {
    fetch(csvUrlInput)
      .then(response => response.text())
      .then(data => {
        words = data.split(',').map(word => word.trim());
        displayWords(words);
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        alert('Failed to load CSV. Please check the URL and try again.');
      })
      .finally(() => {
        loadingSpinner.style.display = 'none'; // Hide loading spinner
      });
    return;
  }

  displayWords(words);
});

// Display words in the output section
function displayWords(words) {
  const wordList = document.getElementById('wordList');
  const wordCount = document.getElementById('wordCount');
  wordList.innerHTML = ''; // Clear previous list
  words.forEach(word => {
    const li = document.createElement('li');
    li.textContent = word;
    const speakerIcon = document.createElement('img');
    speakerIcon.src = 'speaker-icon.jpg';
    speakerIcon.alt = 'Speaker Icon';
    speakerIcon.classList.add('speaker-icon');
    speakerIcon.addEventListener('click', () => speakWord(word));
    li.appendChild(speakerIcon);
    wordList.appendChild(li);
  });
  wordCount.textContent = `Words: ${words.length}`; // Update word count
}

// Auto-dictation function
document.getElementById('autoDictation').addEventListener('click', () => {
  const words = Array.from(document.querySelectorAll('#wordList li')).map(li => li.textContent);
  const interval = document.getElementById('interval').value * 1000; // Convert to milliseconds
  let index = 0;

  // Clear any existing interval
  if (dictationInterval) {
    clearInterval(dictationInterval);
  }

  // Start the auto-dictation
  dictationInterval = setInterval(() => {
    if (index < words.length) {
      speakWord(words[index]);
      index++;
    } else {
      clearInterval(dictationInterval); // Stop when all words are spoken
    }
  }, interval);
});

// Stop auto-dictation function
document.getElementById('stopDictation').addEventListener('click', () => {
  if (dictationInterval) {
    clearInterval(dictationInterval); // Stop the interval
    dictationInterval = null; // Reset the interval variable
  }
});

// Add event listeners to CSV buttons
document.querySelectorAll('.csv-button').forEach(button => {
  button.addEventListener('click', () => {
    const csvUrl = button.getAttribute('data-url');
    document.getElementById('csvUrlInput').value = csvUrl;
  });
});
