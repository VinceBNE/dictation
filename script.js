// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded - initializing script');
  
  // Initialize voices as soon as possible
  let voices = [];
  
  // Function to initialize and load voices
  function initVoices() {
    console.log('Initializing voices');
    return new Promise((resolve) => {
      voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices loaded immediately:', voices.length);
        resolve(voices);
      } else {
        console.log('Waiting for voices to load...');
        window.speechSynthesis.onvoiceschanged = function() {
          voices = window.speechSynthesis.getVoices();
          console.log('Voices loaded asynchronously:', voices.length);
          resolve(voices);
        };
        
        // Fallback if onvoiceschanged doesn't trigger
        setTimeout(() => {
          voices = window.speechSynthesis.getVoices();
          console.log('Voices loaded via timeout:', voices.length);
          resolve(voices);
        }, 1000);
      }
    });
  }
  
  // Initialize voices right away
  if ('speechSynthesis' in window) {
    initVoices();
  } else {
    console.error('Speech synthesis not supported in this browser');
  }
  
  // Function to select the best male Australian voice or acceptable alternative
  function getBestVoice() {
    const allVoices = window.speechSynthesis.getVoices();
    console.log('Available voices:', allVoices.map(v => `${v.name} (${v.lang}) [${v.localService ? 'local' : 'remote'}]`));
    
    // First priority: Daniel (Australian male) or other Australian male voices
    let voice = allVoices.find(v => 
      (v.name.includes('Daniel') || v.name.toLowerCase().includes('australian male')) && 
      v.lang.startsWith('en')
    );
    
    // Second priority: Any Australian voice
    if (!voice) {
      voice = allVoices.find(v => v.lang === 'en-AU');
    }
    
    // Third priority: Any English male voice
    if (!voice) {
      voice = allVoices.find(v => 
        (v.name.includes('Male') || v.name.includes('David') || 
         v.name.includes('Mark') || v.name.includes('James') || 
         v.name.includes('Paul') || v.name.includes('George')) && 
        v.lang.startsWith('en')
      );
    }
    
    // Fourth priority: Any English voice
    if (!voice) {
      voice = allVoices.find(v => v.lang.startsWith('en'));
    }
    
    console.log('Selected voice:', voice ? `${voice.name} (${voice.lang})` : 'Default voice');
    return voice;
  }
  
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

  // Function to speak a word with specified voice settings
  function speakWord(word) {
    console.log('Speaking word:', word);
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      
      // Set voice characteristics
      utterance.volume = 1.0;  // 0 to 1
      utterance.rate = 0.9;    // 0.1 to 10
      utterance.pitch = 0.8;   // 0 to 2 - lower for male voice
      
      // Set the best available voice
      const selectedVoice = getBestVoice();
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Speak the word
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
    const repeatCount = parseInt(document.getElementById('repeatCount').value); // Get repeat count
  
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
  
    // Function to handle word repetition
    function speakWordWithRepetition(word, repeatCount) {
      let repeatIndex = 0;
  
      function speakNextRepetition() {
        if (repeatIndex < repeatCount) {
          speakWord(word);
          repeatIndex++;
          setTimeout(speakNextRepetition, interval); // Wait for the interval before repeating
        } else {
          // Move to the next word after all repetitions are done
          currentWordIndex++;
          if (currentWordIndex >= wordArray.length) {
            stopAutoDictation(); // Stop auto-dictation when all words are done
            return;
          }
          highlightCurrentWord(currentWordIndex);
          speakWordWithRepetition(wordArray[currentWordIndex], repeatCount);
        }
      }
  
      speakNextRepetition();
    }
  
    // Highlight and speak the first word with repetition
    highlightCurrentWord(currentWordIndex);
    speakWordWithRepetition(wordArray[currentWordIndex], repeatCount);
  }

// Stop auto-dictation
function stopAutoDictation() {
  console.log('Stopping auto-dictation');
  
  // Clear the interval for auto-dictation
  if (autoDictationInterval) {
    clearInterval(autoDictationInterval);
    autoDictationInterval = null; // Reset the interval variable
  }
  
  // Stop any ongoing speech
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  // Reset UI elements
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

  // Add a voice test button to check available voices
  const outputSection = document.querySelector('.output-section');
  const voiceTestButton = document.createElement('button');
  voiceTestButton.id = 'voiceTest';
  voiceTestButton.textContent = 'Test Voice';
  voiceTestButton.style.marginTop = '20px';
  voiceTestButton.addEventListener('click', () => {
    speakWord('This is a test of the dictation voice');
  });
  outputSection.appendChild(voiceTestButton);

  console.log('Script initialization complete');
});
