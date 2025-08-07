import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { getSongs, uploadSong } from './api';
import News from './News';
import './App.css';

// Utility functions
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

// Enhanced SongCard Component
function SongCard({ song, volume, onPlay, active, className = '' }) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(50);

  // Sync volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Load metadata when song becomes active
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active) return;

    // Load the audio to get metadata (duration)
    if (audio.readyState < 1) { // HAVE_METADATA = 1
      audio.load();
    }
  }, [active]);

  // Handle active state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (active && !isPlaying && !error) {
      setIsLoading(true);
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Playback failed:', err);
          setError('Playback failed');
          setIsLoading(false);
        });
    } else if (!active && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [active, isPlaying, error]);

  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration || 0);
      setProgress(audio.currentTime || 0);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isNaN(audio.currentTime)) {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    if (onPlay) onPlay(null);
  }, [onPlay]);

  const handleError = useCallback(() => {
    setError('Audio load failed');
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  // Play/pause toggle with improved reliability
  const togglePlay = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Clear any existing errors
    if (error) {
      setError(null);
    }

    // If not the active song, make it active first
    if (!active) {
      if (onPlay) onPlay(song);
      return;
    }

    const audio = audioRef.current;
    if (!audio || isLoading) return;

    if (isPlaying) {
      // Pause the audio
      audio.pause();
      setIsPlaying(false);
      if (onPlay) onPlay(null);
    } else {
      // Play the audio
      setIsLoading(true);
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error('Playback failed:', err);
            setError('Playback failed');
            setIsLoading(false);
            setIsPlaying(false);
          });
      }
    }
  }, [active, isPlaying, onPlay, song, error, isLoading]);

  // Seek functionality - Works even when not playing
  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    
    // If audio duration is not loaded yet, try to load it
    if (isNaN(audio.duration) || audio.duration === 0) {
      // Set a placeholder duration based on a typical song length
      if (duration === 0) {
        setDuration(180); // 3 minutes default
      }
    }
    
    // Set the time in the audio element
    if (!isNaN(audio.duration) && audio.duration > 0) {
      audio.currentTime = newTime;
    }
    
    // Always update the visual progress
    setProgress(newTime);
  }, [duration]);

  // Dynamic tooltip positioning
  const handleMouseMove = useCallback((e) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    
    // Smart positioning: avoid edges and play button area
    let position = percentage;
    if (percentage < 15) position = 15; // Avoid left edge
    if (percentage > 85) position = 85; // Avoid right edge (play button area)
    
    setTooltipPosition(position);
  }, []);

  // Tooltip visibility state
  const [showTooltip, setShowTooltip] = useState(false);

  // Handle mouse enter/leave for tooltip
  const handleMouseEnter = useCallback(() => {
    if (active) {  // Solo necesita estar activa, no necesariamente reproduciéndose
      setShowTooltip(true);
      setTooltipPosition(50); // Default center position
    }
  }, [active]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
    setTooltipPosition(50); // Reset to center
  }, []);

  // Progress percentage for styling
  const progressPercentage = useMemo(() => {
    return duration > 0 ? (progress / duration) * 100 : 0;
  }, [progress, duration]);

  // Render play button content with proper icons
  const renderPlayButton = () => {
    if (isLoading) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3" opacity="0.4">
            <animate attributeName="r" values="3;8;3" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </svg>
      );
    }
    if (error) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      );
    }
    
    if (isPlaying) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      );
    }
  };

  return (
    <article className={`song-card ${active ? 'active' : ''} ${className}`}>
      {song.cover_url && (
        <div className="song-artwork">
          <img 
            src={song.cover_url} 
            alt={`${song.title} cover art`}
            loading="lazy"
          />
        </div>
      )}
      
      <div className="song-info">
        <h3 className="title">{song.title}</h3>
        
        <div className="progress-section">
          <div 
            className="progress-container"
            style={{ '--tooltip-position': `${tooltipPosition}%` }}
          >
            <input
              ref={progressRef}
              type="range"
              className="progress-bar"
              min="0"
              max={duration || 0}
              value={progress}
              step="0.1"
              onChange={handleSeek}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progressPercentage}%, var(--bg-tertiary) ${progressPercentage}%, var(--bg-tertiary) 100%)`
              }}
              aria-label={`Seek ${song.title}`}
              title={`${formatTime(progress)} / ${formatTime(duration)}`}
            />
            {active && showTooltip && (
              <div className="time-tooltip">
                <span className="time-current">{formatTime(progress)}</span>
                <span className="time-separator">•</span>
                <span className="time-remaining">-{formatTime(duration - progress)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="play-controls">
        <button
          className={`play-btn ${isPlaying ? 'pause' : ''} ${isLoading ? 'loading' : ''} ${error ? 'error' : ''}`}
          onClick={togglePlay}
          aria-label={isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
          disabled={isLoading}
        >
          {renderPlayButton()}
        </button>
        
        {/* Waveform Visualizer */}
        <div className="waveform">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="waveform-bar"></div>
          ))}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={song.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      {active && isPlaying && song.description && (
        <div className="extra">
          <p className="description">{song.description}</p>
        </div>
      )}
    </article>
  );
}

// Enhanced CoverCard Component
function CoverCard({ song, onClick }) {
  const handleClick = useCallback(() => {
    // Immediate feedback, then action
    setTimeout(() => {
      onClick?.(song);
    }, 100);
  }, [song, onClick]);

  return (
    <div className="cover-item" onClick={handleClick}>
      <img 
        src={song.cover_url} 
        alt={`${song.title} artwork`}
        loading="lazy"
      />
      <div className="cover-overlay">
        <h4 className="cover-title">{song.title}</h4>
        <p className="cover-hint">
          {song.category === 'cover' ? 'Cover • Click to play' : 'Original • Click to play'}
        </p>
      </div>
    </div>
  );
}

// Enhanced FileInput Component
function FileInput({ accept, onChange, children, ...props }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange?.(e.dataTransfer.files[0]);
    }
  }, [onChange]);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      onChange?.(e.target.files[0]);
    }
  }, [onChange]);

  return (
    <div
      className={`file-input ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        {...props}
      />
      <div className="file-input-text">
        {children}
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [songs, setSongs] = useState([]);
  const [view, setView] = useState('songs');
  const [filter, setFilter] = useState('all');
  const [admin, setAdmin] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentSong, setCurrentSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    mp3File: null,
    coverFile: null,
    description: '',
    category: 'original'
  });
  const [isUploading, setIsUploading] = useState(false);

  // Load songs
  const loadSongs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSongs();
      setSongs(data);
    } catch (err) {
      console.error('Failed to load songs:', err);
      setError('Failed to load songs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Filter songs
  const filteredSongs = useMemo(() => {
    return songs.filter(song => filter === 'all' || song.category === filter);
  }, [songs, filter]);

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.mp3File) {
      alert('Please provide at least a title and MP3 file');
      return;
    }

    try {
      setIsUploading(true);
      await uploadSong(
        formData.title.trim(),
        formData.mp3File,
        formData.coverFile,
        formData.description.trim(),
        formData.category
      );
      
      // Clear cache and form
      try {
        localStorage.removeItem('songs_cache_v1');
      } catch {}
      
      setFormData({
        title: '',
        mp3File: null,
        coverFile: null,
        description: '',
        category: 'original'
      });
      
      await loadSongs();
      setView('songs');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [formData, loadSongs]);

  // Handle admin login
  const handleAdminLogin = useCallback(() => {
    const password = prompt('Enter admin password:');
    if (password === 'ado2025') {
      setAdmin(true);
      setView('upload');
    } else if (password !== null) {
      alert('Incorrect password');
    }
  }, []);

  // Handle song play
  const handleSongPlay = useCallback((song) => {
    setCurrentSong(song);
  }, []);

  // Handle cover click - Navigate to correct category
  const handleCoverClick = useCallback((song) => {
    // Set the song as current immediately
    setCurrentSong(song);
    
    // Set filter to show the clicked song's category
    // This ensures the song is visible in the songs view
    if (song.category) {
      setFilter(song.category);
    } else {
      // If no category, show all to ensure visibility
      setFilter('all');
    }
    
    // Switch to songs view
    setView('songs');
    
    // Optional: Scroll to top to see the song better
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading your music...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>ADO Music</h1>
        
        <nav className="nav-compact">
          {/* Main View Toggle */}
          <div className="nav-group">
            <button 
              className={`nav-btn ${view === 'songs' ? 'active' : ''}`}
              onClick={() => setView('songs')}
            >
              <span className="nav-icon">🎵</span>
              <span>Music</span>
            </button>
            <button 
              className={`nav-btn ${view === 'covers' ? 'active' : ''}`}
              onClick={() => setView('covers')}
            >
              <span className="nav-icon">🎨</span>
              <span>Gallery</span>
            </button>
            <button 
              className={`nav-btn ${view === 'news' ? 'active' : ''}`}
              onClick={() => setView('news')}
            >
              <span className="nav-icon">📰</span>
              <span>News</span>
            </button>
          </div>

          {/* Music Filters - Only visible when in songs view */}
          {view === 'songs' && (
            <div className="filter-pills">
              <button 
                className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-pill ${filter === 'original' ? 'active' : ''}`}
                onClick={() => setFilter('original')}
              >
                Originals
              </button>
              <button 
                className={`filter-pill ${filter === 'cover' ? 'active' : ''}`}
                onClick={() => setFilter('cover')}
              >
                Covers
              </button>
            </div>
          )}

          {/* Admin Section */}
          <div className="nav-admin">
            {admin ? (
              <button 
                className={`nav-btn admin ${view === 'upload' ? 'active' : ''}`}
                onClick={() => setView('upload')}
              >
                <span className="nav-icon">⚡</span>
                <span>Upload</span>
              </button>
            ) : (
              <button 
                className="nav-btn admin"
                onClick={handleAdminLogin}
              >
                <span className="nav-icon">🔑</span>
                <span>Admin</span>
              </button>
            )}
          </div>
        </nav>

        <div className="volume-wrapper">
          <span>VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Master volume"
          />
        </div>
      </header>

      <main>
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadSongs}>Retry</button>
          </div>
        )}

        {/* Songs View */}
        {view === 'songs' && (
          <section className="songs-section">
            {filteredSongs.length === 0 ? (
              <div className="empty-state">
                <h2>No songs found</h2>
                <p>
                  {filter === 'all' 
                    ? 'No songs have been uploaded yet.' 
                    : `No ${filter} songs found.`
                  }
                </p>
              </div>
            ) : (
              filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  volume={volume}
                  onPlay={handleSongPlay}
                  active={song.id === currentSong?.id}
                />
              ))
            )}
          </section>
        )}

        {/* Covers View */}
        {view === 'covers' && (
          <section className="covers-section">
            <div className="covers-grid">
              {songs
                .filter(song => song.cover_url)
                .map((song) => (
                  <CoverCard
                    key={song.id}
                    song={song}
                    onClick={handleCoverClick}
                  />
                ))}
            </div>
            {songs.filter(song => song.cover_url).length === 0 && (
              <div className="empty-state">
                <h2>No artwork found</h2>
                <p>Songs with cover art will appear here.</p>
              </div>
            )}
          </section>
        )}

        {/* News View */}
        {view === 'news' && (
          <News admin={admin} />
        )}

        {/* Upload View */}
        {view === 'upload' && admin && (
          <section className="upload-section">
            <form className="upload" onSubmit={handleSubmit}>
              <h2>Upload New Song</h2>
              
              <div className="form-group">
                <label htmlFor="song-title">Song Title</label>
                <input
                  id="song-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter song title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Audio File (MP3)</label>
                <FileInput
                  accept="audio/mpeg"
                  onChange={(file) => handleInputChange('mp3File', file)}
                >
                  {formData.mp3File ? (
                    <div>
                      <strong>{formData.mp3File.name}</strong>
                      <br />
                      <small>{formatFileSize(formData.mp3File.size)}</small>
                    </div>
                  ) : (
                    <div>
                      <strong>Drop MP3 file here or click to browse</strong>
                      <br />
                      <small>Supported: MP3 files only</small>
                    </div>
                  )}
                </FileInput>
              </div>

              <div className="form-group">
                <label>Cover Art (Optional)</label>
                <FileInput
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(file) => handleInputChange('coverFile', file)}
                >
                  {formData.coverFile ? (
                    <div>
                      <strong>{formData.coverFile.name}</strong>
                      <br />
                      <small>{formatFileSize(formData.coverFile.size)}</small>
                    </div>
                  ) : (
                    <div>
                      <strong>Drop image here or click to browse</strong>
                      <br />
                      <small>Supported: PNG, JPEG</small>
                    </div>
                  )}
                </FileInput>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="original">Original</option>
                  <option value="cover">Cover</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add a description, lyrics, or story about this song..."
                  rows="4"
                />
              </div>

              <button 
                type="submit" 
                disabled={isUploading || !formData.title.trim() || !formData.mp3File}
                className={isUploading ? 'loading' : ''}
              >
                {isUploading ? 'Uploading...' : 'Upload Song'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}