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

// Function to display words in the list
function displayWords(words) {
  const wordList = document.getElementById('wordList');
  wordList.innerHTML = ''; // Clear previous list
  
  words.forEach(word => {
    if (word) { // Only add non-empty words
      const li = document.createElement('li');
      li.textContent = word;
      
      // Create speaker icon
      const speakerIcon = document.createElement('img');
      speakerIcon.src = 'speaker-icon.png'; // Make sure this image exists in your directory
      speakerIcon.alt = 'Speak';
      speakerIcon.className = 'speaker-icon';
      speakerIcon.addEventListener('click', () => {
        speakWord(word);
      });
      
      li.appendChild(speakerIcon);
      wordList.appendChild(li);
    }
  });
}

// Function to speak a word
function speakWord(word) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Speech synthesis not supported');
    alert('Speech synthesis is not supported in your browser');
  }
}

// Variables for auto-dictation
let autoDictationInterval;
let currentWordIndex = 0;
let wordArray = [];

// Start auto-dictation
function startAutoDictation() {
  const interval = parseInt(document.getElementById('interval').value) * 1000;
  if (wordArray.length === 0) {
    alert('Please load words first');
    return;
  }
  
  currentWordIndex = 0;
  document.getElementById('autoDictation').disabled = true;
  document.getElementById('stopDictation').disabled = false;
  
  // Speak the first word immediately
  speakWord(wordArray[currentWordIndex]);
  
  // Set up interval for subsequent words
  autoDictationInterval = setInterval(() => {
    currentWordIndex++;
    if (currentWordIndex >= wordArray.length) {
      stopAutoDictation();
      return;
    }
    speakWord(wordArray[currentWordIndex]);
  }, interval);
}

// Stop auto-dictation
function stopAutoDictation() {
  clearInterval(autoDictationInterval);
  document.getElementById('autoDictation').disabled = false;
  document.getElementById('stopDictation').disabled = true;
}

// Load words from input or CSV URL
document.getElementById('loadWords').addEventListener('click', () => {
  const wordInput = document.getElementById('wordInput').value.trim();
  const csvUrlInput = document.getElementById('csvUrlInput').value.trim();
  
  if (wordInput) {
    wordArray = wordInput.split(',').map(word => word.trim()); // Load from text input
    displayWords(wordArray);
  } else if (csvUrlInput) {
    // Create loading spinner if it doesn't exist
    let loadingSpinner = document.getElementById('loadingSpinner');
    if (!loadingSpinner) {
      loadingSpinner = document.createElement('div');
      loadingSpinner.id = 'loadingSpinner';
      loadingSpinner.className = 'loading-spinner';
      loadingSpinner.textContent = 'Loading...';
      document.querySelector('.output-section').appendChild(loadingSpinner);
    }
    loadingSpinner.style.display = 'flex'; // Show loading spinner
    
    loadWordsFromCSV(csvUrlInput)
      .then(words => {
        wordArray = words;
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
  }
});

// Handle CSV buttons
document.querySelectorAll('.csv-button').forEach(button => {
  button.addEventListener('click', () => {
    const url = button.getAttribute('data-url');
    document.getElementById('csvUrlInput').value = url;
    
    // Create loading spinner if it doesn't exist
    let loadingSpinner = document.getElementById('loadingSpinner');
    if (!loadingSpinner) {
      loadingSpinner = document.createElement('div');
      loadingSpinner.id = 'loadingSpinner';
      loadingSpinner.className = 'loading-spinner';
      loadingSpinner.textContent = 'Loading...';
      document.querySelector('.output-section').appendChild(loadingSpinner);
    }
    loadingSpinner.style.display = 'flex'; // Show loading spinner
    
    loadWordsFromCSV(url)
      .then(words => {
        wordArray = words;
        displayWords(words);
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        alert('Failed to load CSV. Please check the URL and try again.');
      })
      .finally(() => {
        loadingSpinner.style.display = 'none'; // Hide loading spinner
      });
  });
});

// Set up auto-dictation button event listener
document.getElementById('autoDictation').addEventListener('click', startAutoDictation);

// Set up stop-dictation button event listener
document.getElementById('stopDictation').addEventListener('click', stopAutoDictation);

// Initialize by disabling the stop button
window.addEventListener('DOMContentLoaded', () => {
  const stopButton = document.getElementById('stopDictation');
  if (stopButton) {
    stopButton.disabled = true;
  }
});
