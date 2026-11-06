// Find the canvas element in our HTML
const canvas = document.getElementById("wheel-canvas");

// Get the 2D drawing context
const ctx = canvas.getContext("2d");

// Find the form and input field
const optionForm = document.getElementById("option-form");
const optionInput = document.getElementById("option-input");

// Find the list where options will appear
const optionsList = document.getElementById("options-list");

// Find the spin button and result display
const spinButton = document.getElementById("spin-button");
const resultDisplay = document.getElementById("result");

// Track the wheel's current rotation
let currentRotation = 0;

// Track whether the wheel is currently spinning
let isSpinning = false;

let selectedWinner = "";

// Our starting wheel options
let options = [];

// Colors for the wheel segments
const colors = [
  "#c4f45c",
  "#5c9ef4",
  "#f45c8b",
  "#f4b85c",
  "#9b7cf4",
  "#5ce0c4",
  "#f4775c",
  "#a5a5a5"
];

function drawWheel() {

  // Clear anything previously drawn
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Find the center of the canvas
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Set the wheel's radius
  const radius = 240;

  // Handle an empty wheel
  if (options.length === 0) {

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    ctx.fillStyle = "#202020";
    ctx.fill();

    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 3;
    ctx.stroke();

    return;
  }

  // Calculate the size of each segment
  const sliceAngle = (Math.PI * 2) / options.length;

  // Draw each segment
  for (let i = 0; i < options.length; i++) {

    // Calculate the starting and ending angles
    const startAngle = -Math.PI / 2 + (i * sliceAngle);
    const endAngle = startAngle + sliceAngle;

    // Begin drawing a new segment
    ctx.beginPath();

    // Move to the center of the wheel
    ctx.moveTo(centerX, centerY);

    // Draw the curved edge of the segment
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);

    // Close the shape back at the center
    ctx.closePath();

    // Give the segment its color
    ctx.fillStyle = colors[i % colors.length];

    // Fill the segment
    ctx.fill();

    // Add a border between segments
    ctx.strokeStyle = "#121212";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Calculate the middle angle of this segment
    const middleAngle = startAngle + sliceAngle / 2;

    // Save the current canvas state
    ctx.save();

    // Move the drawing origin to the center of the wheel
    ctx.translate(centerX, centerY);

    // Rotate the canvas to match this segment
    ctx.rotate(middleAngle);

    // Set the text styling
    ctx.fillStyle = "#121212";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw the text along the segment's radial direction
    ctx.fillText(options[i], radius * 0.65, 0, 120);

    // Restore the original canvas state
    ctx.restore();
  }
}

function updateOptionsList() {

  // Clear the existing list
  optionsList.innerHTML = "";

  // Go through every option
  for (let i = 0; i < options.length; i++) {

    // Create a new list item
    const listItem = document.createElement("li");

    // Create a span to hold the option's text
    const optionText = document.createElement("span");
    optionText.textContent = options[i];

    // Create a remove button
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.type = "button";

    // Give the button its own click event
    removeButton.addEventListener("click", function() {

      if (isSpinning) {
        return;
      }

      // Remove this option from the array
      options.splice(i, 1);

      // Update everything on the page
      updateOptionsList();
      drawWheel();

    });

    // Put the text and button inside the list item
    listItem.appendChild(optionText);
    listItem.appendChild(removeButton);

    // Add the complete list item to our new HTML list
    optionsList.appendChild(listItem);
  }
}

function spinWheel() {

  // Make sure we have enough options
  if (options.length < 2) {
    resultDisplay.textContent = "Add at least 2 options to spin!";
    return;
  }

  // Prevent another spin while this one is running
  if (isSpinning) {
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;

  // Randomly select the winning option
  const winnerIndex = Math.floor(Math.random() * options.length);
  const winner = options[winnerIndex];
  selectedWinner = winner;

  // Calculate the angle of each segment
  const sliceAngle = (Math.PI * 2) / options.length;

  // Find the center angle of the winning segment
  const winnerAngle = -Math.PI / 2 + (winnerIndex + 0.5) * sliceAngle;

  // Calculate how far the wheel needs to rotate
  const fullCircle = Math.PI * 2;
  const currentRotationRadians = currentRotation * (Math.PI / 180);

  let rotationNeeded = (
    0 - winnerAngle - currentRotationRadians
  ) % fullCircle;

  // Make sure the rotation is positive
  if (rotationNeeded < 0) {
    rotationNeeded += fullCircle;
  }

  // Add five full rotations for the animation
  const extraSpins = 5 * fullCircle;

  // Update our total rotation
  currentRotation += (extraSpins + rotationNeeded) * (180 / Math.PI);

  // Update the result message
  resultDisplay.textContent = "The wheel is spinning...";

  // Start the animation
  canvas.style.transform = `rotate(${currentRotation}deg)`;
}

canvas.addEventListener("transitionend", function(event) {

    if (event.propertyName !== "transform") {
        return;
    }

    isSpinning = false;
    spinButton.disabled = false;

    resultDisplay.textContent = `The wheel chooses: ${selectedWinner}!`;

});

optionForm.addEventListener("submit", function(event) {

  // Prevent the page from refreshing
  event.preventDefault();

  if (isSpinning) {
    return;
  }

  // Get the text entered by the user
  const newOption = optionInput.value.trim();

  // Don't accept empty entries
  if (newOption === "") {
    return;
  }

  // Add the new option to our array
  options.push(newOption);

  // Clear the input field
  optionInput.value = "";

  // Refresh the list and wheel
  updateOptionsList();
  drawWheel();

});

// Start spinning when the button is clicked
spinButton.addEventListener("click", spinWheel);

// Display the initial options and draw the wheel
updateOptionsList();
drawWheel();