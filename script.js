body {
  font-family: system-ui, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f3f4f6;
  margin: 0;
}

.card-container {
  perspective: 1000px; /* Gives the flip a 3D depth effect */
}

.card {
  width: 350px;
  height: 250px;
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  cursor: pointer;
}

/* This is the class JavaScript will trigger */
.card.is-flipped {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  width: 100%;
  height: 100%;
  position: absolute;
  backface-visibility: hidden; /* Hides the back of the element when flipped */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  text-align: center;
}

.card-front {
  background-color: #ffffff;
  color: #1f2937;
}

.card-back {
  background-color: #2563eb;
  color: white;
  transform: rotateY(180deg); /* Pre-flips the back so it's ready */
}