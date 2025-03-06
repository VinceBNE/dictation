// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded - initializing script');
  
  // Function to load words from CSV URL
  function loadWordsFromCSV(url) {
    console.log('Loading CSV from URL:', url);
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(data => {
        console.log('CSV data loaded, processing...');
        return data.split(',').map(word => word.trim()); // Split CSV by commas and trim whitespace
      });
  }

  // Function to display words in the list
  function displayWords(words) {
    console.log('Displaying words:', words);
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = ''; // Clear previous list
    
    words.forEach((word, index) => {
      if (word) { // Only add non-empty words
        const li = document.createElement('li');
        li.textContent = word;
        li.dataset.word = word; // Store the original word
        li.dataset.index = index; // Store the word index
        
        // Create speaker icon
        const speakerIcon = document.createElement('img');
        speakerIcon.src = 'speaker-icon.png'; // Make sure this image exists
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

  // Function to mask words with asterisks during dictation
  function maskWords() {
    const wordListItems = document.querySelectorAll('#wordList li');
    wordListItems.forEach(li => {
      const word = li.dataset.word;
      li.innerHTML = '*'.repeat(word.length); // Replace text with asterisks based on word length
      
      // Re-append the speaker icon
      const speakerIcon = document.createElement('img');
      speakerIcon.src = 'speaker-icon.png';
      speakerIcon.alt = 'Speak';
      speakerIcon.className = 'speaker-icon';
      speakerIcon.addEventListener('click', () => {
        speakWord(li.dataset.word);
      });
      
      li.appendChild(speakerIcon);
    });
  }

  // Function to highlight the current word being read
  function highlightCurrentWord(index) {
    // Remove highlight from all words
    const allWords = document.querySelectorAll('#wordList li');
    allWords.forEach(item => {
      item.classList.remove('current-word');
    });
    
    // Add highlight to current word
    const currentWordElement = document.querySelector(`#wordList li[data-index="${index}"]`);
    if (currentWordElement) {
      currentWordElement.classList.add('current-word');
    }
  }

  // Function to speak a word with Australian male voice
  function speakWord(word) {
    console.log('Speaking word:', word);
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      
      // Try to set Australian male voice
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices);
      
      // Look for Australian male voice
      let australianVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('australian') && 
        voice.name.toLowerCase().includes('male')
      );
      
      // If no specific Australian male voice, try to find any Australian voice
      if (!australianVoice) {
        australianVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('australian') || 
          voice.lang === 'en-AU'
        );
      }
      
      // If no Australian voice at all, try to find any male English voice
      if (!australianVoice) {
        australianVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') && 
          voice.lang.startsWith('en')
        );
      }
      
      if (australianVoice) {
        console.log('Using voice:', australianVoice.name);
        utterance.voice = australianVoice;
      } else {
        console.log('No suitable voice found, using default');
      }
      
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
  let dictationActive = false;

  // Start auto-dictation
  function startAutoDictation() {
    console.log('Starting auto-dictation');
    const interval = parseInt(document.getElementById('interval').value) * 1000;
    if (wordArray.length === 0) {
      alert('Please load words first');
      return;
    }
    
    dictationActive = true;
    currentWordIndex = 0;
    document.getElementById('autoDictation').disabled = true;
    document.getElementById('stopDictation').disabled = false;
    
    // Mask all words with asterisks
    maskWords();
    
    // Highlight and speak the first word
    highlightCurrentWord(currentWordIndex);
    speakWord(wordArray[currentWordIndex]);
    
    // Set up interval for subsequent words
    autoDictationInterval = setInterval(() => {
      currentWordIndex++;
      if (currentWordIndex >= wordArray.length) {
        stopAutoDictation();
        return;
      }
      highlightCurrentWord(currentWordIndex);
      speakWord(wordArray[currentWordIndex]);
    }, interval);
  }

  // Stop auto-dictation
  function stopAutoDictation() {
    console.log('Stopping auto-dictation');
    clearInterval(autoDictationInterval);
    document.getElementById('autoDictation').disabled = false;
    document.getElementById('stopDictation').disabled = true;
    dictationActive = false;
    
    // Restore original word list display
    displayWords(wordArray);
  }

  // Process CSV URL and load words
  function processCSVUrl(url) {
    console.log('Processing CSV URL:', url);
    
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
        console.log('Words loaded successfully:', words);
        wordArray = words;
        displayWords(words);
      })
      .catch(error => {
        console.error('Error loading CSV:', error);
        alert('Failed to load CSV: ' + error.message);
      })
      .finally(() => {
        loadingSpinner.style.display = 'none'; // Hide loading spinner
      });
  }

  // Load words from input or CSV URL button
  const loadWordsButton = document.getElementById('loadWords');
  if (loadWordsButton) {
    loadWordsButton.addEventListener('click', function() {
      console.log('Load words button clicked');
      const wordInput = document.getElementById('wordInput').value.trim();
      const csvUrlInput = document.getElementById('csvUrlInput').value.trim();
      
      if (wordInput) {
        console.log('Loading words from text input');
        wordArray = wordInput.split(',').map(word => word.trim());
        displayWords(wordArray);
      } else if (csvUrlInput) {
        processCSVUrl(csvUrlInput);
      } else {
        alert('Please enter words or a CSV URL.');
      }
    });
  } else {
    console.error('Load words button not found');
  }

  // Handle CSV buttons
  const csvButtons = document.querySelectorAll('.csv-button');
  console.log('Found CSV buttons:', csvButtons.length);
  
  csvButtons.forEach(button => {
    button.addEventListener('click', function() {
      console.log('CSV button clicked:', this.textContent);
      const url = this.getAttribute('data-url');
      console.log('Button URL:', url);
      
      if (url) {
        document.getElementById('csvUrlInput').value = url;
        processCSVUrl(url);
      } else {
        console.error('No data-url attribute found on button');
      }
    });
  });

  // Set up auto-dictation button event listener
  const autoDictationButton = document.getElementById('autoDictation');
  if (autoDictationButton) {
    autoDictationButton.addEventListener('click', startAutoDictation);
  } else {
    console.error('Auto-dictation button not found');
  }

  // Set up stop-dictation button event listener
  const stopDictationButton = document.getElementById('stopDictation');
  if (stopDictationButton) {
    stopDictationButton.addEventListener('click', stopAutoDictation);
    stopDictationButton.disabled = true;
  } else {
    console.error('Stop-dictation button not found');
  }

  // Handle voices loading (needed for some browsers)
  // Some browsers load voices asynchronously
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = function() {
      console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
    };
  }

  console.log('Script initialization complete');
});
