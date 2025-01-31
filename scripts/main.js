let sound = null;
let playlist = [];
let currentTrackIndex = 0;
let updateTimeInterval = null;
let isSeeking = false;

let volume = 1; // Volumen inicial al máximo

// Función para actualizar el volumen
function updateVolume() {
  if (sound) {
    sound.volume(volume);
    // Actualiza el porcentaje de volumen en la interfaz
    const volumePercentageElement = document.getElementById("volumePercentage");
    volumePercentageElement.textContent = `${Math.round(volume * 100)}%`;
  }
}

// Evento para el control de volumen
document
  .getElementById("volumeControl")
  .addEventListener("input", function (e) {
    volume = parseFloat(e.target.value); // Obtiene el valor del control de volumen
    updateVolume(); // Actualiza el volumen y el porcentaje
  });

document.getElementById("fileInput").addEventListener("change", function (e) {
  const files = Array.from(e.target.files);
  playlist = files;
  updatePlaylistDisplay();
  loadTrack(0);
});

// Función para guardar la mixtape
function saveMixtape() {
  const mixtape = {
    date: new Date().toLocaleString(),
    duration: (Date.now() - recordStartTime) / 1000,
    tracks: recordedPlaylist,
    playlist: playlist.map((file) => file.name),
  };

  // Guardar en localStorage
  const mixtapes = JSON.parse(localStorage.getItem("mixtapes") || "[]");
  mixtapes.push(mixtape);
  localStorage.setItem("mixtapes", JSON.stringify(mixtapes));

  // Mostrar mensaje de éxito
  showNotification("Mixtape saved successfully!");
}

function updatePlaylistDisplay() {
  const playlistDiv = document.getElementById("playlist");
  playlistDiv.innerHTML = playlist
    .map(
      (file, index) =>
        `<div class="${index === currentTrackIndex ? "current-track" : ""}">
              ${index + 1}. ${file.name}
          </div>`
    )
    .join("");
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function updateProgressBar() {
  if (sound && sound.playing() && !isSeeking) {
    const current = sound.seek();
    const duration = sound.duration();

    if (duration > 0) {
      const progress = (current / duration) * 100;
      document.getElementById("progressBar").value = progress;
      document.getElementById("currentTime").textContent = formatTime(current);
    }
  }
}

function loadTrack(index) {
  document.getElementById("loading").style.display = "block";
  if (index < 0 || index >= playlist.length) return;
  document.body.style.animation = "glitch 0.3s linear";
  setTimeout(() => (document.body.style.animation = ""), 300);
  document.getElementById("progressBar").value = 0;
  document.getElementById("currentTime").textContent = "00:00";
  document.getElementById("duration").textContent = "00:00";

  if (sound) {
    sound.stop();
    sound.unload();
    clearInterval(updateTimeInterval);
  }

  currentTrackIndex = index;
  const file = playlist[index];
  const objectURL = URL.createObjectURL(file);

  document.getElementById("currentTrack").textContent = `Playing: ${file.name}`;
  addHistoryEntry(file.name);
  document.getElementById("progressBar").value = 0;
  updatePlaylistDisplay();

  sound = new Howl({
    src: [objectURL],
    html5: true,
    format: ["mp3", "wav", "ogg"],
    volume: volume, // Aplica el volumen actual
    onplay: () => {
      document.getElementById("playBtn").disabled = true;
      document.getElementById("pauseBtn").disabled = false;

      clearInterval(updateTimeInterval);
      updateTimeInterval = setInterval(updateProgressBar, 100);
    },
    onpause: () => {
      document.getElementById("playBtn").disabled = false;
      document.getElementById("pauseBtn").disabled = true;
      clearInterval(updateTimeInterval);
    },
    onend: () => {
      loadTrack((currentTrackIndex + 1) % playlist.length);
    },
    onload: () => {
      const duration = sound.duration();
      document.getElementById("duration").textContent = formatTime(duration);

      updateTimeInterval = setInterval(updateProgressBar, 100);
    },
    onstop: () => {
      document.getElementById("progressBar").value = 0;
      document.getElementById("currentTime").textContent = "00:00";
    },
  });
  sound.on(
    "load",
    () => (document.getElementById("loading").style.display = "none")
  );

  sound.play();
}

document.getElementById("progressBar").addEventListener("input", function () {
  isSeeking = true;
});

document.getElementById("progressBar").addEventListener("change", function () {
  if (sound) {
    const seekTo = sound.duration() * (this.value / 100);
    sound.seek(seekTo);
    isSeeking = false;
  }
});

document.getElementById("playBtn").addEventListener("click", () => {
  if (sound && !sound.playing()) {
    sound.play();
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  if (sound && sound.playing()) {
    sound.pause();
  }
});

document.getElementById("nextBtn").addEventListener("click", () => {
  loadTrack((currentTrackIndex + 1) % playlist.length);
});

// Agrega el evento para el botón aleatorio
document.getElementById("randomBtn").addEventListener("click", () => {
  if (playlist.length > 0) {
    const randomIndex = Math.floor(Math.random() * playlist.length);
    loadTrack(randomIndex);
  }
});

// Agrega al inicio con las otras variables
let historyEntries = [];
const MAX_HISTORY = 50;

// Función para agregar entradas al historial
function addHistoryEntry(trackName) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = {
    timestamp,
    track: trackName,
    icon: ["📀"],
  };

  historyEntries.unshift(entry);

  if (historyEntries.length > MAX_HISTORY) {
    historyEntries.pop();
  }

  updateHistoryDisplay();
}

// Función para actualizar la visualización
function updateHistoryDisplay() {
  const historyContainer = document.querySelector(".history-entries");
  historyContainer.innerHTML = historyEntries
    .map(
      (entry) => `
      <div class="history-entry">
        <span style="color: #8f8">[${entry.timestamp}]</span>
        ${entry.icon} ${entry.track}
      </div>
    `
    )
    .join("");

  // Auto-scroll al principio
  historyContainer.scrollTop = 0;
}

window.addEventListener("load", () => {
  document.getElementById("progressBar").value = 0;
  document.getElementById("currentTime").textContent = "00:00";
  document.getElementById("duration").textContent = "00:00";
});

window.addEventListener("load", function () {
  setTimeout(function () {
    const loadingScreen = document.querySelector(".loading-screen");
    loadingScreen.classList.add("hidden"); // Agrega la clase para desvanecer

    // Elimina la pantalla de carga después de la transición
    loadingScreen.addEventListener("transitionend", () => {
      loadingScreen.style.display = "none";
    });
  }, 2500);
});
