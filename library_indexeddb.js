let libraryContent = document.getElementById('library-content');
let songsCount = document.getElementById('songs-count');
let db;
let currentMediaUrl = null;

window.onload = function () {
  initDB();
  setupLibraryEventListeners();
  setupFooterControls();
};

function initDB() {
  const request = indexedDB.open('MediaLibrary', 1);

  request.onerror = function (event) {
    console.error('Database error:', event.target.error);
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    loadLibrary();
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('media', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('name', 'name', { unique: false });
  };
}

function setupLibraryEventListeners() {
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('file-input');

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
  }
}

function setupFooterControls() {
  const audioPlayer = document.getElementById("local-audio-player");
  const playBtn = document.getElementById("play");
  const progressSlider = document.getElementById("progress-slider");
  const currentTimeDisplay = document.getElementById("current-time");
  const durationTimeDisplay = document.getElementById("duration-time");

  if (!audioPlayer || !playBtn) return;

  playBtn.addEventListener("click", () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
    } else {
      audioPlayer.pause();
    }
  });

  audioPlayer.ontimeupdate = function () {
    if (progressSlider && audioPlayer.duration) {
      const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progressSlider.value = progress;
    }
    if (currentTimeDisplay) {
      currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    }
    if (durationTimeDisplay && audioPlayer.duration) {
      durationTimeDisplay.textContent = formatTime(audioPlayer.duration);
    }
  };

  progressSlider.addEventListener("input", () => {
    if (audioPlayer.duration) {
      const time = (progressSlider.value / 100) * audioPlayer.duration;
      audioPlayer.currentTime = time;
    }
  });

  audioPlayer.onplay = () => {
    isPlaying = true;
    updatePlayButton(true);
  };

  audioPlayer.onpause = () => {
    isPlaying = false;
    updatePlayButton(false);
  };

  audioPlayer.onended = () => {
    isPlaying = false;
    updatePlayButton(false);
  };

  audioPlayer.onerror = (e) => {
    console.error("Audio Error:", e);
    alert("Could not play this audio.");
  };
}

function handleFileUpload(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  files.forEach(file => {
    if (file.type.startsWith('audio/') || file.type === 'video/mp4') {
      const reader = new FileReader();
      reader.onload = function (event) {
        const mediaItem = {
          name: file.name,
          data: event.target.result,
          mimeType: file.type,
          type: file.type.startsWith('audio/') ? 'audio' : 'video',
          dateAdded: new Date().toLocaleDateString()
        };
        saveMediaToDB(mediaItem);
      };
      reader.readAsDataURL(file);
    } else {
      alert(`Unsupported file: ${file.name}`);
    }
  });

  e.target.value = '';
}

function saveMediaToDB(mediaItem) {
  const transaction = db.transaction(['media'], 'readwrite');
  const objectStore = transaction.objectStore('media');
  const request = objectStore.add(mediaItem);

  request.onsuccess = function () {
    loadLibrary();
  };

  request.onerror = function (event) {
    console.error('Save error:', event.target.error);
  };
}

function loadLibrary() {
  const localSongsList = document.getElementById('local-songs-list');
  if (localSongsList) localSongsList.innerHTML = '';
  if (libraryContent) libraryContent.innerHTML = '';

  const transaction = db.transaction(['media'], 'readonly');
  const objectStore = transaction.objectStore('media');
  const request = objectStore.getAll();

  request.onsuccess = function (event) {
    const savedMedia = event.target.result;

    savedMedia.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'local-song-item';
      div.innerHTML = `${item.type === 'audio' ? '🎵' : '🎬'} ${item.name.replace(/\.[^/.]+$/, '')}`;
      div.onclick = () => playMediaItem(item);
      localSongsList.appendChild(div);

      const mediaDiv = document.createElement('div');
      mediaDiv.className = 'library-song-item';
      mediaDiv.innerHTML = `
        <div class="song-cover">${item.type === 'audio' ? '🎵' : '🎬'}</div>
        <div class="song-info">
          <h4>${item.name.replace(/\.[^/.]+$/, '')}</h4>
          <p>Local ${item.type === 'audio' ? 'Audio File' : 'Video File'} • ${item.dateAdded}</p>
        </div>
        <div class="song-actions">
          <button class="play-song-btn" onclick='playMediaItem(${JSON.stringify(item)})'>▶️</button>
        </div>`;
      libraryContent.appendChild(mediaDiv);
    });

    if (songsCount) {
      songsCount.textContent = `${savedMedia.length} ${savedMedia.length === 1 ? 'item' : 'items'}`;
    }
  };
}

function playMediaItem(mediaItem) {
  const byteCharacters = atob(mediaItem.data.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mediaItem.mimeType });
  const mediaUrl = URL.createObjectURL(blob);
  currentMediaUrl = mediaUrl;

  const currentSongDisplay = document.getElementById('current-song');
  if (currentSongDisplay) {
    currentSongDisplay.textContent = mediaItem.name.replace(/\.[^/.]+$/, '');
  }

  const currentPlayerDiv = document.getElementById('current-player');
  const localAudioPlayer = document.getElementById('local-audio-player');

  if (mediaItem.type === 'audio') {
    if (localAudioPlayer) {
      localAudioPlayer.pause();
      localAudioPlayer.src = mediaUrl;
      localAudioPlayer.play();
    }
    if (currentPlayerDiv) currentPlayerDiv.innerHTML = '';
  } else if (mediaItem.type === 'video') {
    if (localAudioPlayer) localAudioPlayer.pause();
    if (currentPlayerDiv) {
      currentPlayerDiv.innerHTML = `
        <div class="video-player">
          <video controls autoplay style="width: 100%; max-width: 800px; max-height: 50vw; border-radius: 8px; display: block; margin: 0 auto; background: #000;">
            <source src="${mediaUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          <div class="video-info">
            <h3>${mediaItem.name.replace(/\.[^/.]+$/, '')}</h3>
            <p>Playing Video from Library</p>
          </div>
        </div>`;
      // Optional: Add error handling for video playback
      const videoEl = currentPlayerDiv.querySelector('video');
      if (videoEl) {
        videoEl.onerror = () => {
          alert("Could not play this video file.");
        };
      }
    }
  }

  currentSong = { ...mediaItem, url: mediaUrl };
  isPlaying = true;
  updatePlayButton(true);
  setTimeout(() => URL.revokeObjectURL(mediaUrl), 10000);
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function focusSearch() {
  window.location.href = 'spotify.html';
}
