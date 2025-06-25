import React, { useEffect, useState, useRef } from 'react';
import { getSongs, uploadSong } from './api';
import './App.css';

export default function App() {
  const [songs, setSongs] = useState([]);
  const [view, setView] = useState('songs'); // 'songs' | 'covers' | 'upload'
  const [filter, setFilter] = useState('all'); 
  const [admin, setAdmin] = useState(false);
  const [volume, setVolume] = useState(0.8);


  const [title, setTitle] = useState('');
  const [mp3File, setMp3File] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [description, setDescription] = useState('');
  const [currentSong, setCurrentSong] = useState(null);

  const cargar = async () => {
    const data = await getSongs();
    setSongs(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !mp3File) return;
    try {
      await uploadSong(title.trim(), mp3File, coverFile, description.trim());
      setTitle('');
      setMp3File(null);
      setCoverFile(null);
      setDescription('');
      e.target.reset();
      cargar();
      setView('songs');
    } catch (err) {
      alert('Upload error');
    }
  };

  const doLogin = () => {
    const pwd = prompt('Admin password');
    if (pwd === 'ado2025') {
      setAdmin(true);
      setView('upload');
    } else {
      alert('Wrong password');
    }
  };

  function secondsToMinSec(sec){
    const m=Math.floor(sec/60).toString().padStart(2,'0');
    const s=Math.floor(sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function SongCard({ song, volume, onPlay, active }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
      if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
      if (active && !playing) {
        const audio = audioRef.current;
        if (audio) {
          audio.play().then(() => setPlaying(true));
          audio.onended = () => { setPlaying(false); onPlay && onPlay(null); };
        }
      }
      if (!active && playing) {
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          setPlaying(false);
        }
      }
    }, [active]);

    const togglePlay = () => {
      if (!active) {
        onPlay && onPlay(song);
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      if (playing) {
        audio.pause();
        setPlaying(false);
        onPlay && onPlay(null);
      } else {
        audio.play().then(() => setPlaying(true));
        audio.onended = () => { setPlaying(false); onPlay && onPlay(null); };
      }
    };

    const handleTimeUpdate = () => {
      const a = audioRef.current;
      setProgress(a.currentTime);
      setDuration(a.duration || 0);
    };

    const seek = (e) => {
      const val = parseFloat(e.target.value);
      audioRef.current.currentTime = val;
      setProgress(val);
    };

    return (
      <div className={`song-card ${active?'active':''}`}>
        {song.cover_url && <img src={song.cover_url} alt={song.title} />}
        <div style={{ flex: 1 }}>
          <div className="title">{song.title}</div>
          <div style={{flex:1}}>
            <input type="range" min="0" max={duration} value={progress} step="0.1" onChange={seek} style={{width:'100%'}} />
            <div style={{fontSize:'0.7rem',color:'#b3b3b3',display:'flex',justifyContent:'space-between'}}>
              <span>{secondsToMinSec(progress)}</span>
              <span>{secondsToMinSec(duration)}</span>
            </div>
          </div>
        </div>
        <button className={`play-btn ${playing ? 'pause' : ''}`} onClick={togglePlay}>
          {playing ? '❚❚' : '▶'}
        </button>
        <audio ref={audioRef} src={song.audio_url} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleTimeUpdate} />
        {active && (
          <div className="extra">
            {song.description && <div style={{fontSize:'0.85rem',color:'#b3b3b3',marginBottom:'.4rem'}}>{song.description}</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <header>
        <h1>ADO Music</h1>
        <button className={view === 'songs' ? 'active' : ''} onClick={() => setView('songs')}>Songs</button>
        {view==='songs' && (
          <>
            <button className={filter==='all'? 'active':''} onClick={()=>setFilter('all')}>All</button>
            <button className={filter==='original'? 'active':''} onClick={()=>setFilter('original')}>Originals</button>
            <button className={filter==='cover'? 'active':''} onClick={()=>setFilter('cover')}>Covers</button>
          </>
        )}
        <button className={view === 'covers' ? 'active' : ''} onClick={() => setView('covers')}>Artworks</button>
        {admin ? (
          <button className={view === 'upload' ? 'active' : ''} onClick={() => setView('upload')}>Upload</button>
        ) : (
          <button onClick={doLogin}>Admin</button>
        )}

        <div className="volume-wrapper">
          <span style={{fontSize:'0.9rem',color:'#b3b3b3'}}>VOL</span>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e=>setVolume(parseFloat(e.target.value))} />
        </div>
      </header>

      <main>
        <section style={{display: view==='songs' ? 'block':'none'}}>
          {songs.filter(s=> filter==='all'|| s.category===filter).map((s) => (
            <SongCard key={s.id} song={s} volume={volume} onPlay={(song)=>setCurrentSong(song)} active={s.id === currentSong?.id} />
          ))}
        </section>

        <section className="covers-grid" style={{display: view==='covers' ? 'grid':'none'}}>
          {songs.filter((s) => s.cover_url).map((s) => (
            <img key={s.id} src={s.cover_url} alt={s.title} />
          ))}
        </section>

        {view === 'upload' && admin && (
          <form className="upload" onSubmit={handleSubmit}>
            <h2>Upload song</h2>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
            />
            <input type="file" accept="audio/mpeg" onChange={(e) => setMp3File(e.target.files[0])} />
            <input type="file" accept="image/png, image/jpeg" onChange={(e) => setCoverFile(e.target.files[0])} />
            <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} style={{resize:'vertical',minHeight:'60px',background:'#282828',color:'#fff',border:'none',borderRadius:'4px',padding:'.6rem .8rem'}} />
            <button>Subir</button>
          </form>
        )}
      </main>

    </>
  );
} 