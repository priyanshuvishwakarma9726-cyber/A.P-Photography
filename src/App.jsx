import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { Camera, Download, X, Lock, UploadCloud, Database, Users, ImagePlus, UserX, UserCheck, Grid, Trash2, Edit2, Check, BarChart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Home() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(true);
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    fetch('/api/images')
      .then(res => res.json())
      .then(data => {
        const processed = data.map(img => {
          const parts = img.url.split('/upload/');
          const optimized_url = parts.length === 2 ? `${parts[0]}/upload/q_auto,f_auto,w_800/${parts[1]}` : img.url;
          return { ...img, optimized_url };
        });
        setImages(processed);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching images:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetch(`/api/users/status?clerkId=${user.id}`)
        .then(res => res.json())
        .then(data => setIsAllowed(data.isAllowed === undefined ? true : !!data.isAllowed))
        .catch(console.error);
    }
  }, [isSignedIn, user]);

  const handleSecretClick = () => {
    const code = window.prompt("Secret Code:");
    if (code === (import.meta.env.VITE_ADMIN_SECRET_CODE || "12345") || code === "Paisa") {
      sessionStorage.setItem("isAdmin", "true");
      navigate("/admin-dashboard");
    } else if (code) {
      alert("Invalid code. Intruder detected.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800 flex flex-col">
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 text-xl tracking-widest font-bold"
        >
          <Camera className="w-6 h-6" />
          <span>A.P Photography<span className="text-zinc-500">.</span></span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-medium transition-colors border bg-transparent text-zinc-300 border-zinc-800 hover:border-zinc-500 hover:text-white">
                Client Login
              </button>
            </SignInButton>
          </SignedOut>
        </motion.div>
      </header>

      <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto text-center flex flex-col items-center justify-center flex-1 w-full">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
        >
          Capturing <span className="text-zinc-500 italic">Moments</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-zinc-400 max-w-2xl text-center"
        >
          A selection of recent works focusing on mood, architecture, and editorial fashion.
        </motion.p>
      </section>

      <main className="px-6 pb-24 max-w-7xl mx-auto w-full flex-1">
        {loading ? (
          <div className="text-zinc-500 text-center py-12">Loading collection...</div>
        ) : images.length === 0 ? (
          <div className="text-zinc-600 text-center py-12 border border-zinc-800 rounded-2xl max-w-md mx-auto">
            <Database className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>Database connected, but no images found.</p>
            <p className="text-sm mt-1">Access the hidden admin panel to upload photos.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 5) * 0.1 + 0.1 }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl break-inside-avoid bg-zinc-900 border border-zinc-800/50"
              >
                <img
                  src={img.optimized_url || img.url}
                  alt={img.title}
                  loading="lazy"
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105 group-hover:opacity-60"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => setSelectedImage(img)}
                    className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white font-medium hover:bg-white/20 transition-colors border border-white/20 hover:scale-105 active:scale-95 transform"
                  >
                    View Work
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-8 border-t border-zinc-900 relative flex justify-center mt-12 group">
        <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} A.P Photography. All rights reserved.</p>
        <button
          onClick={handleSecretClick}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent hover:bg-zinc-800/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          title="Secret Access"
          aria-label="Secret Access"
        >
          <Lock className="w-3 h-3 text-zinc-700" />
        </button>
      </footer>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-md"
          >
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedImage(null)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-screen"
            >
              <div className="flex-1 bg-black/50 flex items-center justify-center p-4 md:p-8 relative min-h-[50vh] md:min-h-[70vh]">
                <img
                  src={selectedImage.optimized_url || selectedImage.url}
                  alt={selectedImage.title}
                  className="max-h-full w-auto object-contain rounded-lg drop-shadow-2xl"
                />
              </div>

              <div className="w-full md:w-80 bg-zinc-950/80 p-8 flex flex-col justify-between border-l border-zinc-800 border-t md:border-t-0">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedImage.title}</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    {selectedImage.category || 'Portfolio Collection'}
                  </p>
                </div>

                <div className="space-y-4">
                  {isSignedIn ? (
                    !isAllowed ? (
                      <div className="p-4 bg-red-950/30 rounded-2xl border border-red-900/50 text-center">
                        <Lock className="w-5 h-5 mx-auto text-red-500 mb-2" />
                        <p className="text-sm text-red-400 font-medium">Access Suspended</p>
                        <p className="text-xs text-zinc-500 mt-1">You no longer have permission to download high-res files.</p>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(selectedImage.url);
                            const blob = await res.blob();
                            const downloadUrl = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = downloadUrl;
                            a.download = `STUDIO_${selectedImage.title.replace(/\s+/g, '_')}.jpg`;
                            document.body.appendChild(a);

                            await fetch('/api/analytics/track', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: user.id, photoId: selectedImage.id })
                            }).catch(() => { });

                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(downloadUrl);
                          } catch (err) {
                            alert("Download failed.");
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-full font-semibold hover:bg-zinc-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download High-Res
                      </button>
                    )
                  ) : (
                    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-center">
                      <Lock className="w-5 h-5 mx-auto text-zinc-500 mb-2" />
                      <p className="text-xs text-zinc-400">
                        High-res downloads require authentication.
                      </p>
                      <SignInButton mode="modal">
                        <button className="mt-3 text-white text-sm font-medium hover:underline bg-white/10 px-4 py-2 rounded-lg">Sign In Now</button>
                      </SignInButton>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="w-full py-3 rounded-full font-medium text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-800"
                  >
                    Close
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black rounded-full text-white/70 hover:text-white transition-colors z-10 hidden md:block"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const isAdminSession = sessionStorage.getItem("isAdmin") === "true";

  const [activeTab, setActiveTab] = useState('upload');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [analyticsData, setAnalyticsData] = useState({ totalDownloads: 0, topPhotos: [], recentActivity: [] });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users' && isAdminSession) fetchUsers();
    if (activeTab === 'manage' && isAdminSession) fetchImages();
    if (activeTab === 'analytics' && isAdminSession) fetchAnalytics();
  }, [activeTab, isAdminSession]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) setAnalyticsData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchImages = async () => {
    setImagesLoading(true);
    try {
      const res = await fetch('/api/images');
      if (res.ok) {
        const data = await res.json();
        setImages(data.map(img => {
          const parts = img.url.split('/upload/');
          const optimized_url = parts.length === 2 ? `${parts[0]}/upload/q_auto,f_auto,w_800/${parts[1]}` : img.url;
          return { ...img, optimized_url };
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleDelete = async (id, imageTitle) => {
    if (!window.confirm(`Are you sure you want to completely delete "${imageTitle}" from Cloudinary and Database?`)) return;
    try {
      const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages(images.filter(img => img.id !== id));
      } else {
        const err = await res.json();
        alert('Delete failed: ' + err.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const saveEdit = async (id) => {
    try {
      const res = await fetch(`/api/images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, category: editCategory })
      });
      if (res.ok) {
        setImages(images.map(img => img.id === id ? { ...img, title: editTitle, category: editCategory } : img));
        setEditingImage(null);
      } else {
        const err = await res.json();
        alert('Edit failed: ' + err.error);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const toggleAccess = async (clerkId, currentStatus) => {
    try {
      const res = await fetch('/api/users/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, isAllowed: !currentStatus })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdminSession) {
    return <Navigate to="/" />;
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    try {
      // 1. Ask Backend for Cloudinary secure signature
      const signRes = await fetch('/api/sign');
      const { timestamp, signature, apiKey, cloudName, folder } = await signRes.json();

      // 2. Transmit DIRECT to Cloudinary Cloud with SIGNATURE
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!cloudinaryRes.ok) {
        const errorText = await cloudinaryRes.text();
        throw new Error("Cloudinary Error: " + errorText);
      }
      const cloudData = await cloudinaryRes.json();

      const dbRes = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          url: cloudData.secure_url,
          public_id: cloudData.public_id
        })
      });

      if (dbRes.ok) {
        alert('Upload successful!');
        setFile(null); setTitle(''); setCategory('');
      } else {
        alert('Database Error');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 font-sans overflow-auto pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard <span className="text-red-500">•</span></h1>
            <p className="text-zinc-400 mt-2">Manage portfolio uploads and client access.</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 w-full md:w-auto">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-1 md:flex-none justify-center ${activeTab === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <ImagePlus className="w-4 h-4" /> Upload
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-1 md:flex-none justify-center ${activeTab === 'manage' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <Grid className="w-4 h-4" /> Manage
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-1 md:flex-none justify-center ${activeTab === 'users' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <Users className="w-4 h-4" /> Users
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-1 md:flex-none justify-center ${activeTab === 'analytics' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <BarChart className="w-4 h-4" /> Analytics
              </button>
            </div>

            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              className="w-12 h-12 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center cursor-pointer border border-red-500/20 hover:bg-red-500/20 transition-colors"
              onClick={() => {
                sessionStorage.removeItem("isAdmin");
                navigate("/");
              }}
              title="Logout Admin"
            >
              <Lock className="w-5 h-5 text-red-500" />
            </motion.div>
          </div>
        </div>

        {activeTab === 'upload' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
          >
            <h2 className="text-xl mb-6 text-white font-semibold flex items-center gap-2">
              <UploadCloud className="text-green-400" /> Secure High-Res Upload
            </h2>
            <form onSubmit={handleUpload} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Image Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    required
                    placeholder="e.g. Neon Cyberpunk Street"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                    placeholder="e.g. Architecture, Editorial"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Select High-Res Image File *</label>
                <div className="relative border-2 border-dashed border-zinc-800 rounded-xl p-8 hover:border-zinc-600 transition-colors bg-zinc-950 group text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  {file ? (
                    <p className="text-green-400 font-medium tracking-tight">Selected: {file.name}</p>
                  ) : (
                    <div>
                      <UploadCloud className="w-8 h-8 text-zinc-600 mx-auto mb-3 group-hover:text-white transition-colors" />
                      <p className="text-zinc-400">Drag & drop your file here or click to browse.</p>
                      <p className="text-xs text-zinc-600 mt-2">Unsigned upload directly to Cloudinary.</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file || !title}
                className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 tracking-tight"
              >
                {uploading ? 'Uploading securely...' : 'Upload to Cloudinary & Save to Database'}
              </button>
            </form>
          </motion.div>
        ) : activeTab === 'manage' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
          >
            <h2 className="text-xl mb-6 text-white font-semibold flex items-center gap-2">
              <Grid className="text-zinc-400" /> Manage Collection
            </h2>

            {imagesLoading ? (
              <div className="text-zinc-500 py-12 text-center">Loading images...</div>
            ) : images.length === 0 ? (
              <div className="text-zinc-500 py-12 text-center border border-zinc-800 border-dashed rounded-xl">No images found in database.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map(img => (
                  <div key={img.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden group">
                    <div className="relative h-48 bg-zinc-900 border-b border-zinc-800">
                      <img src={img.optimized_url || img.url} alt={img.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-4">
                      {editingImage === img.id ? (
                        <div className="space-y-3">
                          <input
                            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-sm text-white"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            placeholder="Title"
                          />
                          <input
                            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-sm text-white"
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                            placeholder="Category"
                          />
                          <div className="flex gap-2 font-medium">
                            <button onClick={() => saveEdit(img.id)} className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 py-2 rounded flex justify-center"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingImage(null)} className="flex-1 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 py-2 rounded flex justify-center"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-white font-bold truncate">{img.title}</h3>
                          <p className="text-zinc-400 text-sm mb-4 truncate">{img.category || 'Uncategorized'}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setEditingImage(img.id); setEditTitle(img.title); setEditCategory(img.category); }}
                              className="flex-1 bg-zinc-800 text-white rounded py-2 text-sm flex items-center justify-center gap-2 hover:bg-zinc-700 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(img.id, img.title)}
                              className="bg-red-500/10 text-red-500 rounded px-4 py-2 flex items-center justify-center hover:bg-red-500/20 transition"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'analytics' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-xl">
              <h2 className="text-xl mb-6 text-white font-semibold flex items-center gap-2">
                <BarChart className="text-purple-400" /> Platform Analytics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Download className="w-8 h-8 text-zinc-500 mb-3" />
                  <p className="text-zinc-400 text-sm uppercase tracking-wider font-semibold mb-1">Total Downloads</p>
                  <p className="text-4xl text-white font-extrabold">{analyticsLoading ? '...' : analyticsData.totalDownloads}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg text-white font-semibold mb-4 border-b border-zinc-800 pb-2">Top 5 Most Downloaded</h3>
                  <div className="space-y-3">
                    {analyticsData.topPhotos.length === 0 ? (
                      <p className="text-zinc-500 text-sm">No downloads recorded yet.</p>
                    ) : (
                      analyticsData.topPhotos.map((photo, idx) => (
                        <div key={photo.id} className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                          <div className="w-8 text-center text-zinc-500 font-bold">#{idx + 1}</div>
                          <img src={photo.url} alt={photo.title} className="w-12 h-12 object-cover rounded shadow" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate text-sm">{photo.title}</p>
                          </div>
                          <div className="px-3 py-1 bg-zinc-900 rounded-lg text-xs font-bold text-zinc-300">
                            {photo.download_count} dls
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg text-white font-semibold mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" /> Recent Activity Feed
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {analyticsData.recentActivity.length === 0 ? (
                      <p className="text-zinc-500 text-sm">No recent activity.</p>
                    ) : (
                      analyticsData.recentActivity.map((act, i) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-sm">
                          <p className="text-zinc-300">
                            <span className="font-semibold text-white">{act.userName}</span> downloaded <span className="text-zinc-400 font-medium">"{act.photoTitle}"</span>
                          </p>
                          <p className="text-xs text-zinc-600 mt-1">
                            {new Date(act.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 border border-zinc-800 p-1 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden"
          >
            <div className="p-7 border-b border-zinc-900">
              <h2 className="text-xl text-white font-semibold flex items-center gap-2">
                <Users className="text-blue-400" /> Client Access Management
              </h2>
            </div>

            <div className="overflow-x-auto p-1">
              <table className="w-full text-left text-sm whitespace-nowrap table-fixed md:table-auto">
                <thead className="text-zinc-500 uppercase text-xs tracking-wider border-b border-zinc-800/50">
                  <tr>
                    <th className="w-1/3 px-6 py-4 font-semibold">Client Name</th>
                    <th className="px-6 py-4 font-semibold hidden md:table-cell">Email Address</th>
                    <th className="px-6 py-4 font-semibold hidden sm:table-cell">Joined Date</th>
                    <th className="px-6 py-4 font-semibold text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                        Fetching registered users from Clerk Database...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                        No authenticated users found yet.
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-white truncate max-w-[150px]">{u.name}</td>
                        <td className="px-6 py-4 text-zinc-400 truncate max-w-[200px] hidden md:table-cell">{u.email}</td>
                        <td className="px-6 py-4 text-zinc-500 hidden sm:table-cell">{new Date(u.joinedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleAccess(u.id, u.isAllowed)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!u.isAllowed
                              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                              : 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
                              }`}
                          >
                            {!u.isAllowed ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {!u.isAllowed ? 'Blocked' : 'Allowed'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY === 'pk_test_dummy_key_replace_me' || PUBLISHABLE_KEY === 'pk_test_placeholder') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl border border-zinc-800 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Clerk Key Required</h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Please add your actual Clerk Publishable Key manually.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  );
}
