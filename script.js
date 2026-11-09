const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// Mobile navigation
const menuToggle = $(".menu-toggle");
const mainNav = $("#main-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});
$$(".main-nav a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

// Project notebooks: each toggle controls only its own details panel.
$$(".project-toggle").forEach(button => {
  button.addEventListener("click", () => {
    const panelId = button.getAttribute("aria-controls");
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const shouldOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(shouldOpen));
    panel.hidden = !shouldOpen;
    button.firstChild.textContent = shouldOpen ? "Close project notes " : "Open project notes ";
  });
});

// Circuit Lab — three independent parallel branches.
// ========================================
// BANTU ARIQ! — CAMPUS QUEST GAME
// ========================================

(() => {
  const canvas = document.getElementById("quest-canvas");
  const overlay = document.getElementById("quest-overlay");
  const startButton = document.getElementById("quest-start");

  if (!canvas || !overlay || !startButton) return;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const TILE = 40;
  const COLS = 18;
  const ROWS = 10;
  const GAME_DURATION = 45;

  const map = [
    "##################",
    "#................#",
    "#..##.....#......#",
    "#...........##...#",
    "#.###............#",
    "#......##........#",
    "#...........#....#",
    "#..##............#",
    "#................#",
    "##################"
  ];

  const items = [
    { id: "resistor", x: 4, y: 1, color: "#f4a340", symbol: "〰" },
    { id: "capacitor", x: 14, y: 4, color: "#64d6e8", symbol: "▯" },
    { id: "chip", x: 5, y: 7, color: "#c9f27a", symbol: "▦" }
  ];

  const exit = { x: 16, y: 8 };

  let player = { x: 1, y: 1 };
  let collected = [];
  let timeLeft = GAME_DURATION;
  let gameActive = false;
  let lastMove = 0;
  let lastTime = 0;
  let animationId = null;
  let keys = {};

  const partsDisplay = document.getElementById("quest-parts");
  const timeDisplay = document.getElementById("quest-time");
  const titleDisplay = document.getElementById("quest-overlay-title");
  const copyDisplay = document.getElementById("quest-overlay-copy");

  function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grass background
    ctx.fillStyle = "#456b50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground tiles
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x * TILE;
        const py = y * TILE;

        if (map[y][x] === "#") {
          drawTree(px, py);
        } else {
          ctx.fillStyle = (x + y) % 2 === 0 ? "#527b5a" : "#4c7355";
          ctx.fillRect(px, py, TILE, TILE);

          // Small grass details
          ctx.fillStyle = "rgba(220,255,190,0.10)";
          ctx.fillRect(px + 8, py + 10, 3, 3);
          ctx.fillRect(px + 29, py + 27, 3, 3);
        }
      }
    }

    // Campus paths
    ctx.fillStyle = "#c2ad82";
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (map[y][x] !== "#") {
          const px = x * TILE;
          const py = y * TILE;

          if ((x + y) % 3 === 0) {
            ctx.fillRect(px + 17, py + 17, 5, 5);
          }
        }
      }
    }

    drawLaboratory();
    drawItems();
    drawPlayer();
  }

  function drawTree(x, y) {
    ctx.fillStyle = "#31513d";
    ctx.fillRect(x + 4, y + 9, 32, 27);

    ctx.fillStyle = "#244331";
    ctx.fillRect(x + 9, y + 4, 22, 30);

    ctx.fillStyle = "#6b9b5e";
    ctx.fillRect(x + 10, y + 7, 20, 16);

    ctx.fillStyle = "#82b76b";
    ctx.fillRect(x + 14, y + 5, 8, 6);

    ctx.fillStyle = "#76573b";
    ctx.fillRect(x + 17, y + 28, 7, 10);
  }

  function drawLaboratory() {
    const x = exit.x * TILE;
    const y = exit.y * TILE;

    // Building
    ctx.fillStyle = "#d9d5c2";
    ctx.fillRect(x - 5, y - 18, 48, 56);

    // Roof
    ctx.fillStyle = "#a85d4b";
    ctx.fillRect(x - 9, y - 22, 56, 10);

    // Door
    ctx.fillStyle = "#52616a";
    ctx.fillRect(x + 11, y + 13, 16, 25);

    // Windows
    ctx.fillStyle = "#79c9d6";
    ctx.fillRect(x, y - 8, 9, 11);
    ctx.fillRect(x + 29, y - 8, 9, 11);

    // Sign
    ctx.fillStyle = "#f4edcf";
    ctx.fillRect(x + 3, y - 32, 34, 10);

    ctx.fillStyle = "#293c39";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.fillText("LAB", x + 20, y - 25);

    if (collected.length < 3) {
      ctx.fillStyle = "rgba(20,25,20,0.75)";
      ctx.font = "bold 8px monospace";
      ctx.fillText("LOCKED", x + 20, y + 48);
    } else {
      ctx.fillStyle = "#d8ff91";
      ctx.font = "bold 8px monospace";
      ctx.fillText("GO HERE!", x + 20, y + 48);
    }
  }

  function drawItems() {
    items.forEach(item => {
      if (collected.includes(item.id)) return;

      const x = item.x * TILE;
      const y = item.y * TILE;

      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(x + 9, y + 28, 23, 5);

      ctx.fillStyle = item.color;
      ctx.fillRect(x + 10, y + 10, 20, 20);

      ctx.fillStyle = "#20312a";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.symbol, x + 20, y + 20);

      ctx.fillStyle = "#fff";
      ctx.font = "7px monospace";
      ctx.fillText("PART", x + 20, y + 36);
    });
  }

  function drawPlayer() {
    const x = player.x * TILE;
    const y = player.y * TILE;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x + 9, y + 32, 23, 5);

    // Legs
    ctx.fillStyle = "#26394a";
    ctx.fillRect(x + 12, y + 27, 6, 10);
    ctx.fillRect(x + 23, y + 27, 6, 10);

    // Body
    ctx.fillStyle = "#4779a8";
    ctx.fillRect(x + 9, y + 16, 22, 15);

    // Head
    ctx.fillStyle = "#e8b58e";
    ctx.fillRect(x + 11, y + 4, 18, 16);

    // Hair
    ctx.fillStyle = "#302c2b";
    ctx.fillRect(x + 10, y + 3, 20, 7);
    ctx.fillRect(x + 8, y + 8, 4, 7);

    // Eyes
    ctx.fillStyle = "#202020";
    ctx.fillRect(x + 15, y + 11, 2, 2);
    ctx.fillRect(x + 24, y + 11, 2, 2);

    // Backpack
    ctx.fillStyle = "#c9f27a";
    ctx.fillRect(x + 28, y + 18, 6, 11);
  }

  function updateDisplay() {
    partsDisplay.textContent = `${collected.length} / 3`;
    timeDisplay.textContent = `${Math.ceil(timeLeft)}s`;

    document.querySelectorAll(".quest-objective").forEach(element => {
      element.classList.toggle(
        "collected",
        collected.includes(element.dataset.item)
      );
    });
  }

  function canMove(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    return map[y][x] !== "#";
  }

  function movePlayer(dx, dy) {
    if (!gameActive) return;

    const nextX = player.x + dx;
    const nextY = player.y + dy;

    if (!canMove(nextX, nextY)) return;

    player.x = nextX;
    player.y = nextY;

    collectItem();
    checkExit();
    drawScene();
  }

  function collectItem() {
    const item = items.find(item =>
      item.x === player.x &&
      item.y === player.y &&
      !collected.includes(item.id)
    );

    if (!item) return;

    collected.push(item.id);
    updateDisplay();

    if (collected.length === 3) {
      copyDisplay.textContent =
        "All components collected! Now hurry to the laboratory!";
    }
  }

  function checkExit() {
    if (player.x !== exit.x || player.y !== exit.y) return;

    if (collected.length === 3) {
      finishGame(true);
    } else {
      copyDisplay.textContent =
        "The laboratory is locked! Collect all 3 components first.";
    }
  }

  function finishGame(won) {
    gameActive = false;
    cancelAnimationFrame(animationId);

    overlay.hidden = false;

    titleDisplay.textContent = won
      ? "Mission completed!"
      : "Time is up!";

    copyDisplay.textContent = won
      ? "You did it! Ariq has everything he needs for his project. Thank you for helping!"
      : "Ariq ran out of time. Give it another try and collect all the components!";

    startButton.textContent = won ? "PLAY AGAIN ↻" : "TRY AGAIN ↻";
  }

  function resetGame() {
    player = { x: 1, y: 1 };
    collected = [];
    timeLeft = GAME_DURATION;
    lastMove = 0;
    lastTime = 0;
    keys = {};

    updateDisplay();
    drawScene();
  }

  function gameLoop(timestamp) {
    if (!gameActive) return;

    if (!lastTime) lastTime = timestamp;

    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    timeLeft -= delta;

    if (timeLeft <= 0) {
      timeLeft = 0;
      updateDisplay();
      finishGame(false);
      return;
    }

    updateDisplay();

    if (timestamp - lastMove > 135) {
      let dx = 0;
      let dy = 0;

      if (keys.ArrowUp || keys.w) dy = -1;
      else if (keys.ArrowDown || keys.s) dy = 1;
      else if (keys.ArrowLeft || keys.a) dx = -1;
      else if (keys.ArrowRight || keys.d) dx = 1;

      if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy);
        lastMove = timestamp;
      }
    }

    animationId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    cancelAnimationFrame(animationId);
    resetGame();

    titleDisplay.textContent = "Ariq needs your help!";
    copyDisplay.textContent =
      "Collect the resistor, capacitor, and microchip. Then guide Ariq to the laboratory!";

    startButton.textContent = "LET'S GO →";
    overlay.hidden = true;

    gameActive = true;
    animationId = requestAnimationFrame(gameLoop);
  }

  // Keyboard controls
  document.addEventListener("keydown", event => {
    const key = event.key.length === 1
      ? event.key.toLowerCase()
      : event.key;

    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)
    ) {
      event.preventDefault();
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(key)) {
      keys[key] = true;
    }
  });

  document.addEventListener("keyup", event => {
    const key = event.key.length === 1
      ? event.key.toLowerCase()
      : event.key;

    keys[key] = false;
  });

  window.addEventListener("blur", () => {
    keys = {};
  });

  // Mobile controls
  document.querySelectorAll(".quest-mobile-controls button").forEach(button => {
    const direction = {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight"
    };

    const key = direction[button.dataset.dir];

    button.addEventListener("pointerdown", event => {
      event.preventDefault();
      keys[key] = true;
    });

    ["pointerup", "pointerleave", "pointercancel"].forEach(type => {
      button.addEventListener(type, () => {
        keys[key] = false;
      });
    });
  });

  startButton.addEventListener("click", startGame);

  updateDisplay();
  drawScene();
})();

// Active section indicator
const navLinks = $$(".main-nav a");
const sections = navLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach(section => observer.observe(section));
}

$("#year").textContent = new Date().getFullYear();
