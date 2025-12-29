'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Trash2, Eye, Send } from 'lucide-react';

const ORGANIZATION_ID = '18762b37-3a9a-42ed-a6a1-0a1dadadcdf3';
const BACKEND_URL = 'https://postiz-app-production-b46f.up.railway.app';
const POSTIZ_API_KEY = '7b0be2ac67eab4d8b157bcd5909105ab9c618830024dcecd64a67c54c8c03018';

interface Integration {
  id: string;
  name: string;
  identifier: string;
  picture: string;
  disabled: boolean;
  profile?: any;
}

interface Post {
  id: string;
  group: string;
  content: string[];
  status: string;
  submittedForOrder: boolean;
  integration?: {
    id: string;
    name: string;
    providerIdentifier: string;
  };
  publishDate: string;
}

export default function MarketingOSDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadData();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadIntegrations(),
        loadPosts()
      ]);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from backend');
    } finally {
      setLoading(false);
    }
  };

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/public/v1/integrations`, {
        headers: {
          'Authorization': `Bearer ${POSTIZ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch integrations: ${response.status}`);
      }
      
      const data = await response.json();
      setIntegrations(data || []);
    } catch (err) {
      console.error('Error loading integrations:', err);
      setIntegrations([]);
    }
  };

  const loadPosts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/posts?page=0`, {
        headers: {
          'Authorization': `Bearer ${POSTIZ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }
      
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Error loading posts:', err);
      setPosts([]);
    }
  };

  const handleConnectIntegration = (provider: string) => {
    // Open OAuth URL
    const url = `${BACKEND_URL}/integrations/social/${provider}`;
    window.open(url, '_blank', 'width=600,height=700');
  };

  const filteredPosts = posts.filter(post => {
    if (filterPlatform !== 'all' && post.integration?.providerIdentifier !== filterPlatform) {
      return false;
    }
    if (filterStatus !== 'all' && post.status !== filterStatus) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading MarketingOS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">MarketingOS Control Panel</h1>
            <button
              onClick={() => loadData()}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Integrations Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔗 Connected Integrations</h2>
          
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No integrations connected yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center gap-3"
                >
                  {integration.picture && (
                    <img
                      src={integration.picture}
                      alt={integration.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{integration.name}</p>
                    <p className="text-sm text-gray-500 truncate">{integration.identifier}</p>
                  </div>
                  {!integration.disabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Connect New Integrations */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Connect New Platform:</p>
            <div className="flex flex-wrap gap-2">
              {['instagram', 'tiktok', 'linkedin', 'twitter', 'facebook'].map((provider) => (
                <button
                  key={provider}
                  onClick={() => handleConnectIntegration(provider)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors capitalize"
                >
                  + {provider}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📝 Generated Content</h2>
            <div className="flex gap-2">
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Platforms</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="READY">Ready</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.slice(0, 20).map((post) => (
                <div
                  key={post.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {post.integration && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {post.integration.providerIdentifier}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          post.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                          post.status === 'READY' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-900 line-clamp-2 mb-1">
                        {post.content?.[0]?.substring(0, 150) || 'No content'}
                        {(post.content?.[0]?.length || 0) > 150 ? '...' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.publishDate).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Post"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Metrics Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Total Posts</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{posts.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Published</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {posts.filter(p => p.status === 'PUBLISHED').length}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600 font-medium">Ready</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {posts.filter(p => p.status === 'READY').length}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Integrations</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{integrations.length}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Post Preview Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Post Preview</h3>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Platform</p>
                  <p className="text-gray-900 capitalize">
                    {selectedPost.integration?.providerIdentifier || 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    selectedPost.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                    selectedPost.status === 'READY' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedPost.status}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Content</p>
                  <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                    {selectedPost.content?.join('\n\n') || 'No content'}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Publish Date</p>
                  <p className="text-gray-900">
                    {new Date(selectedPost.publishDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

