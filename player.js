// Use existing global variables
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');
const currentPlayerDiv = document.getElementById('current-player');

// Replace with your real YouTube API key
const YOUTUBE_API_KEY = 'AIzaSyCUCx0CV_3Mhdr9Dr9sEwUUfXZjSpbFRps';

searchBtn.addEventListener('click', searchYouTube);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchYouTube();
});

function searchYouTube() {
  const query = searchInput.value.trim();
  if (!query) return;

  resultsDiv.innerHTML = '<p style="color: #1db954;">Searching YouTube...</p>';
  // Increased maxResults to 25 for more results
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=100&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;

  fetch(searchUrl)
    .then(res => res.json())
    .then(data => {
      resultsDiv.innerHTML = '';
      if (data.items?.length > 0) {
        const section = document.createElement('div');
        section.className = 'popular-section';
        section.innerHTML = `<h3>Search Results for "${query}"</h3>`;
        resultsDiv.appendChild(section);

        data.items.forEach(item => {
          createVideoCard({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channel: item.snippet.channelTitle
          });
        });

        playSpecificVideo(data.items[0].id.videoId, data.items[0].snippet.title);
      } else {
        resultsDiv.innerHTML = '<p style="color: #b3b3b3;">No results found.</p>';
      }
    })
    .catch(err => {
      console.error('YouTube search error:', err);
      searchYouTubeAlternative(query);
    });
}

function searchYouTubeAlternative(query) {
  resultsDiv.innerHTML = '';
  const section = document.createElement('div');
  section.className = 'popular-section';
  section.innerHTML = `<h3>Search Results for "${query}"</h3>`;
  resultsDiv.appendChild(section);

  const variations = [`${query}`, `${query} official`, `${query} lyrics`, `${query} cover`, `${query} live`, `${query} remix`];
  variations.forEach((text, i) => {
    createSearchCard(text, i);
  });

  playYouTubeSearch(query);
}

function createVideoCard(video) {
  const div = document.createElement('div');
  div.className = 'song-card';
  div.innerHTML = `
    <img src="${video.thumbnail}" alt="${video.title}">
    <p>${video.title}</p>
    <span class="channel-name">${video.channel}</span>
  `;
  div.onclick = () => playSpecificVideo(video.id, video.title);
  resultsDiv.appendChild(div);
}

function createSearchCard(searchQuery, index) {
  const div = document.createElement('div');
  div.className = 'song-card';
  div.innerHTML = `
    <div class="placeholder-thumbnail">🎵</div>
    <p>${searchQuery}</p>
    <span class="channel-name">Search Result ${index + 1}</span>
  `;
  div.onclick = () => playYouTubeSearch(searchQuery);
  resultsDiv.appendChild(div);
}

function playSpecificVideo(videoId, title) {
  const localAudioPlayer = document.getElementById('local-audio-player');
  localAudioPlayer.style.display = 'none';
  localAudioPlayer.pause();

  const progressSlider = document.getElementById('progress-slider');
  const currentTimeDisplay = document.getElementById('current-time');
  const durationTimeDisplay = document.getElementById('duration-time');
  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');

  if (progressSlider) {
    progressSlider.value = 0;
    progressSlider.disabled = true;
    currentTimeDisplay.textContent = "--:--";
    durationTimeDisplay.textContent = "--:--";
  }

  if (nextBtn) nextBtn.classList.add('disabled');
  if (prevBtn) prevBtn.classList.add('disabled');

  currentSong = { type: 'youtube', id: videoId, title: title };
  document.getElementById('current-song').textContent = title;

  // Responsive wrapper for YouTube player
  currentPlayerDiv.innerHTML = `
    <div class="responsive-player-wrapper">
      <iframe id="yt-player"
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&enablejsapi=1"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        style="display:block;">
      </iframe>
    </div>
    <div id="yt-player-error" style="color:#ff6b6b;margin-top:10px;display:none;"></div>
  `;

  // Add error handling for iframe load failure (embedding restrictions)
  setTimeout(() => {
    const iframe = document.getElementById('yt-player');
    if (iframe) {
      iframe.onerror = function () {
        showYouTubeError("This video cannot be played (embedding may be disabled).");
      };
      // Fallback: If iframe doesn't load after a short time, show error
      iframe.onload = function () {
        // Sometimes YouTube shows an error inside the iframe, but we can't detect it directly.
        // So, we can check for blank iframe after a delay.
        setTimeout(() => {
          if (iframe.contentWindow && iframe.contentDocument && iframe.contentDocument.body.innerHTML.length < 100) {
            showYouTubeError("This video cannot be played (embedding may be disabled).");
          }
        }, 1500);
      };
    }
  }, 300);

  function showYouTubeError(msg) {
    const errDiv = document.getElementById('yt-player-error');
    if (errDiv) {
      errDiv.style.display = 'block';
      errDiv.innerHTML = msg + `<br><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="color:#1db954;">Watch on YouTube</a>`;
    }
  }

  isPlaying = true;
  updatePlayButton(true);
}

function playYouTubeSearch(query) {
  const localAudioPlayer = document.getElementById('local-audio-player');
  localAudioPlayer.style.display = 'none';
  localAudioPlayer.pause();

  const progressSlider = document.getElementById('progress-slider');
  const currentTimeDisplay = document.getElementById('current-time');
  const durationTimeDisplay = document.getElementById('duration-time');

  if (progressSlider) {
    progressSlider.value = 0;
    progressSlider.disabled = true;
    currentTimeDisplay.textContent = "--:--";
    durationTimeDisplay.textContent = "--:--";
  }

  currentSong = { type: 'youtube', query: query };
  document.getElementById('current-song').textContent = query;

  const encoded = encodeURIComponent(query);
  currentPlayerDiv.innerHTML = `
    <div class="responsive-player-wrapper">
      <iframe id="yt-player"
        src="https://www.youtube.com/embed?listType=search&list=${encoded}&autoplay=1&enablejsapi=1"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        style="display:block;">
      </iframe>
    </div>
    <div id="yt-player-error" style="color:#ff6b6b;margin-top:10px;display:none;"></div>
  `;

  // Add error handling for iframe load failure (embedding restrictions)
  setTimeout(() => {
    const iframe = document.getElementById('yt-player');
    if (iframe) {
      iframe.onerror = function () {
        showYouTubeError("This video cannot be played (embedding may be disabled).");
      };
      iframe.onload = function () {
        setTimeout(() => {
          if (iframe.contentWindow && iframe.contentDocument && iframe.contentDocument.body.innerHTML.length < 100) {
            showYouTubeError("This video cannot be played (embedding may be disabled).");
          }
        }, 1500);
      };
    }
  }, 300);

  function showYouTubeError(msg) {
    const errDiv = document.getElementById('yt-player-error');
    if (errDiv) {
      errDiv.style.display = 'block';
      errDiv.innerHTML = msg + `<br><a href="https://www.youtube.com/results?search_query=${encoded}" target="_blank" style="color:#1db954;">Search on YouTube</a>`;
    }
  }

  isPlaying = true;
  updatePlayButton(true);
}

function updatePlayButton(state) {
  const playBtn = document.getElementById("play");
  if (playBtn) {
    isPlaying = state;
    playBtn.textContent = isPlaying ? "⏸️" : "▶️";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showDefaultContent();
});

function showDefaultContent() {
  const section = document.createElement('div');
  section.className = 'popular-section';
  section.innerHTML = '<h3>Search for music on YouTube</h3>';
  const p = document.createElement('p');
  p.style.color = '#b3b3b3';
  p.style.textAlign = 'center';
  p.style.padding = '40px';
  p.textContent = 'Use the search bar above to find and play music from YouTube';
  resultsDiv.appendChild(section);
  resultsDiv.appendChild(p);
}

// Add responsive CSS for player (inject only once)
if (!document.getElementById('responsive-player-style')) {
  const style = document.createElement('style');
  style.id = 'responsive-player-style';
  style.innerHTML = `
    .responsive-player-wrapper {
      position: relative;
      width: 100%;
      max-width: 700px;
      margin: 0 auto;
      padding-top: 56.25%; /* 16:9 Aspect Ratio */
      box-sizing: border-box;
    }
    .responsive-player-wrapper iframe {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 10px;
      background: #000;
      max-width: 100vw;
      max-height: 70vh;
      min-height: 200px;
      display: block;
    }
    body, html {
      overflow-x: hidden !important;
    }
  `;
  document.head.appendChild(style);
}
