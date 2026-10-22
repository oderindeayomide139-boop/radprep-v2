// 1. Tell JavaScript to find the HTML element with the ID 'flashcard'
const flashcard = document.getElementById('flashcard');

// 2. Tell it to listen for a 'click' on that specific element
flashcard.addEventListener('click', function() {
  
  // 3. When clicked, toggle the 'is-flipped' CSS class on or off
  flashcard.classList.toggle('is-flipped');
  
});