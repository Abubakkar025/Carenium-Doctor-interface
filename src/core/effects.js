const icons = ["⚕", "💊", "🧬", "🩺", "📊", "🫀"];

function createFallingItem() {
  const container = document.getElementById("falling-container");
  if (!container) return; // Only run if container exists
    
  const item = document.createElement("div");
  item.className = "falling-item";
  item.innerText = icons[Math.floor(Math.random() * icons.length)];

  item.style.left = Math.random() * 100 + "%";
  item.style.animationDuration = 5 + Math.random() * 5 + "s";

  container.appendChild(item);

  setTimeout(() => item.remove(), 10000);
}

// Start the interval
setInterval(createFallingItem, 700);

console.log("Carenium Effects: Falling icons initialized.");
