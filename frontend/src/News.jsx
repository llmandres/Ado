import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './api';

const News = ({ admin = false }) => {
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFeatured, setShowFeatured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    source_url: '',
    source_name: '',
    author: '',
    is_featured: false,
    tags: '',
    image: null
  });

  useEffect(() => {
    fetchCategories();
    fetchNews();
  }, [selectedCategory, showFeatured]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/news`;
      const params = new URLSearchParams();
      
      if (showFeatured) {
        params.append('featured', 'true');
      } else if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      } else {
        setError('Failed to fetch news');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateNews = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    formData.append('title', createForm.title);
    formData.append('content', createForm.content);
    formData.append('excerpt', createForm.excerpt);
    formData.append('category', createForm.category);
    formData.append('source_url', createForm.source_url);
    formData.append('source_name', createForm.source_name);
    formData.append('author', createForm.author);
    formData.append('published_date', new Date().toISOString());
    formData.append('is_featured', createForm.is_featured);
    formData.append('tags', createForm.tags);
    
    if (createForm.image) {
      formData.append('image', createForm.image);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/news`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          content: '',
          excerpt: '',
          category: '',
          source_url: '',
          source_name: '',
          author: '',
          is_featured: false,
          tags: '',
          image: null
        });
        fetchNews();
      } else {
        alert('Failed to create news post');
      }
    } catch (err) {
      console.error('Error creating news:', err);
      alert('Error creating news post');
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#8b5cf6';
  };

  const getCategoryIcon = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || '📰';
  };

  if (loading) {
    return (
      <div className="news-container">
        <div className="news-header">
          <h2>Ado News</h2>
          <p>Loading the latest news...</p>
        </div>
        <div className="news-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-container">
        <div className="news-error">
          <h3>Error loading news</h3>
          <p>{error}</p>
          <button onClick={fetchNews} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="news-container">
      <div className="news-header">
        <h2>Ado News</h2>
        <p>Latest news and updates about the artist</p>
        {admin && (
          <button 
            className="create-news-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">✨</span>
            Create News
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="news-filters">
        <div className="filter-group">
          <button
            className={`filter-btn ${selectedCategory === 'all' && !showFeatured ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setShowFeatured(false);
            }}
          >
            All
          </button>
          <button
            className={`filter-btn ${showFeatured ? 'active' : ''}`}
            onClick={() => {
              setShowFeatured(true);
              setSelectedCategory('all');
            }}
          >
            ⭐ Featured
          </button>
        </div>
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
              style={{ '--category-color': category.color }}
              onClick={() => {
                setSelectedCategory(category.name);
                setShowFeatured(false);
              }}
            >
              <span className="category-icon">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="news-grid">
        {news.length === 0 ? (
          <div className="no-news">
            <h3>No news available</h3>
            <p>No news found for the selected filters.</p>
          </div>
        ) : (
          news.map(post => (
            <article
              key={post.id}
              className={`news-card ${post.is_featured ? 'featured' : ''}`}
              onClick={() => setSelectedPost(post)}
            >
              {post.image_url && (
                <div className="news-image">
                  <img src={post.image_url} alt={post.title} />
                  {post.is_featured && (
                    <div className="featured-badge">
                      <span>⭐ Featured</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="news-content">
                <div className="news-meta">
                  <span 
                    className="news-category"
                    style={{ backgroundColor: getCategoryColor(post.category) }}
                  >
                    {getCategoryIcon(post.category)} {post.category}
                  </span>
                  <time className="news-date">
                    {formatDate(post.published_date)}
                  </time>
                </div>
                
                <h3 className="news-title">{post.title}</h3>
                
                <p className="news-excerpt">
                  {post.excerpt || truncateText(post.content)}
                </p>
                
                <div className="news-footer">
                  {post.source_name && (
                    <span className="news-source">
                      🔗 {post.source_name}
                    </span>
                  )}
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="news-tags">
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="news-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <button className="read-more-btn">
                  Read more →
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* News Detail Modal */}
      {selectedPost && (
        <div className="news-modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="news-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedPost(null)}
            >
              ✕
            </button>
            
            <div className="modal-content">
              {selectedPost.image_url && (
                <img 
                  src={selectedPost.image_url} 
                  alt={selectedPost.title}
                  className="modal-image"
                />
              )}
              
              <div className="modal-header">
                <div className="modal-meta">
                  <span 
                    className="modal-category"
                    style={{ backgroundColor: getCategoryColor(selectedPost.category) }}
                  >
                    {getCategoryIcon(selectedPost.category)} {selectedPost.category}
                  </span>
                  <time className="modal-date">
                    {formatDate(selectedPost.published_date)}
                  </time>
                </div>
                
                <h1 className="modal-title">{selectedPost.title}</h1>
                
                {selectedPost.author && (
                  <p className="modal-author">By {selectedPost.author}</p>
                )}
              </div>
              
              <div className="modal-body">
                <div 
                  className="modal-text"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedPost.content.replace(/\n/g, '<br>') 
                  }}
                />
                
                {selectedPost.source_url && (
                  <a 
                    href={selectedPost.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-source-link"
                  >
                    📖 Read full article on {selectedPost.source_name}
                  </a>
                )}
                
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="modal-tags">
                    <h4>Tags:</h4>
                    <div className="tag-list">
                      {selectedPost.tags.map(tag => (
                        <span key={tag} className="modal-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create News Modal - Admin Only */}
      {admin && showCreateModal && (
        <div className="news-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="news-modal create-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setShowCreateModal(false)}
            >
              ✕
            </button>
            
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Create New Article</h2>
                <p className="modal-subtitle">Share the latest news about Ado</p>
              </div>
              
              <form onSubmit={handleCreateNews} className="create-news-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="title">Article Title</label>
                    <input
                      id="title"
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                      placeholder="Enter a compelling headline..."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      value={createForm.category}
                      onChange={(e) => setCreateForm({...createForm, category: e.target.value})}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="author">Author</label>
                    <input
                      id="author"
                      type="text"
                      value={createForm.author}
                      onChange={(e) => setCreateForm({...createForm, author: e.target.value})}
                      placeholder="Author name"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="excerpt">Excerpt</label>
                    <input
                      id="excerpt"
                      type="text"
                      value={createForm.excerpt}
                      onChange={(e) => setCreateForm({...createForm, excerpt: e.target.value})}
                      placeholder="Brief summary of the article..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="source_name">Source</label>
                    <input
                      id="source_name"
                      type="text"
                      value={createForm.source_name}
                      onChange={(e) => setCreateForm({...createForm, source_name: e.target.value})}
                      placeholder="e.g. The Guardian, Billboard"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="source_url">Source URL</label>
                    <input
                      id="source_url"
                      type="url"
                      value={createForm.source_url}
                      onChange={(e) => setCreateForm({...createForm, source_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="content">Article Content</label>
                    <textarea
                      id="content"
                      value={createForm.content}
                      onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                      placeholder="Write the full article content here..."
                      rows="8"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tags">Tags</label>
                    <input
                      id="tags"
                      type="text"
                      value={createForm.tags}
                      onChange={(e) => setCreateForm({...createForm, tags: e.target.value})}
                      placeholder="World Tour, Album Release, Vocaloid"
                    />
                    <small>Separate tags with commas</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="image">Featured Image</label>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCreateForm({...createForm, image: e.target.files[0]})}
                    />
                  </div>

                  <div className="form-group featured-toggle">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={createForm.is_featured}
                        onChange={(e) => setCreateForm({...createForm, is_featured: e.target.checked})}
                      />
                      <span className="checkmark"></span>
                      Featured Article
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <span className="btn-icon">✨</span>
                    Publish Article
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;