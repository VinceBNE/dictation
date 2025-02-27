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
  wordList.innerHTML = ''; // Clear previous list

  let words = [];

  if (wordInput) {
    words = wordInput.split(',').map(word => word.trim());
  } else if (csvUrlInput) {
    fetch(csvUrlInput)
      .then(response => response.text())
      .then(data => {
        words = data.split(',').map(word => word.trim());
        displayWords(words);
      })
      .catch(error => console.error('Error loading CSV:', error));
    return;
  }

  displayWords(words);
});

// Display words in the output section
function displayWords(words) {
  const wordList = document.getElementById('wordList');
  words.forEach(word => {
    const li = document.createElement('li');
    li.textContent = word;
    const speakerIcon = document.createElement('img');
    speakerIcon.src = 'speaker-icon.jpg'; // Updated to use JPG
    speakerIcon.alt = 'Speaker Icon'; // Accessibility
    speakerIcon.classList.add('speaker-icon');
    speakerIcon.addEventListener('click', () => speakWord(word));
    li.appendChild(speakerIcon);
    wordList.appendChild(li);
  });
}

// Auto-dictation function
document.getElementById('autoDictation').addEventListener('click', () => {
  const words = Array.from(document.querySelectorAll('#wordList li')).map(li => li.textContent);
  const interval = document.getElementById('interval').value * 1000; // Convert to milliseconds
  let index = 0;

  function speakNextWord() {
    if (index < words.length) {
      speakWord(words[index]);
      index++;
      setTimeout(speakNextWord, interval);
    }
  }

  speakNextWord();
});

// Add event listeners to CSV buttons
document.querySelectorAll('.csv-button').forEach(button => {
  button.addEventListener('click', () => {
    const csvUrl = button.getAttribute('data-url');
    document.getElementById('csvUrlInput').value = csvUrl;
  });
});
