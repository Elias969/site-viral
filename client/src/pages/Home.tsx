"use client";
import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Share2, Download, Zap, MapPin, TrendingUp } from "lucide-react";
import { getLoginUrl } from "@/const";

const categoryColors = {
  meme: "#3b82f6",
  poll: "#10b981",
  moment: "#f97316",
};

const categoryIcons = {
  meme: "😂",
  poll: "📊",
  moment: "⭐",
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<"meme" | "poll" | "moment" | "all">("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));

  const postsQuery = trpc.posts.list.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    city: selectedCity || undefined,
  });

  const topPostsQuery = trpc.posts.top.useQuery(10);
  const upvoteMutation = trpc.upvotes.add.useMutation();
  const reactionMutation = trpc.reactions.add.useMutation();
  const commentMutation = trpc.comments.create.useMutation();

  const posts = postsQuery.data || [];
  const topPosts = topPostsQuery.data || [];

  const handleUpvote = (postId: number) => {
    upvoteMutation.mutate({ postId, sessionId });
  };

  const handleReaction = (postId: number, emoji: string) => {
    reactionMutation.mutate({ postId, emoji });
  };

  const handleComment = (postId: number, name: string, content: string) => {
    commentMutation.mutate({ postId, authorName: name, content });
  };

  const handleShare = (post: any) => {
    const text = `Confira este conteúdo em MapBrasil: ${post.title} em ${post.city}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleDownload = (imageUrl: string, format: "png" | "sticker") => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `mapbrasil-${format}.${format === "png" ? "png" : "webp"}`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">MapBrasil</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button onClick={() => setShowSubmit(true)} className="bg-blue-600 hover:bg-blue-700">
                  Enviar Conteúdo
                </Button>
                <span className="text-sm text-slate-600">{user?.name}</span>
              </>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())} variant="outline">
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden shadow-lg">
              <div className="p-4 bg-white border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Mapa Interativo</h2>
                <div className="flex gap-2 mb-4">
                  {(["all", "meme", "poll", "moment"] as const).map((cat) => (
                    <Button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="sm"
                      className={selectedCategory === cat ? "bg-blue-600" : ""}
                    >
                      {cat === "all" ? "Todos" : cat === "meme" ? "😂 Memes" : cat === "poll" ? "📊 Enquetes" : "⭐ Momentos"}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Buscar por cidade..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full"
                />
              </div>

              <MapContainer
                center={[-15.8, -48.0]}
                zoom={4}
                className="w-full h-[500px]"
                style={{ background: "#f0f9ff" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {posts.map((post) => (
                  <Marker
                    key={post.id}
                    position={[parseFloat(post.lat), parseFloat(post.lng)]}
                    icon={L.divIcon({
                      html: `<div style="background-color: ${categoryColors[post.category as keyof typeof categoryColors]}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">${categoryIcons[post.category as keyof typeof categoryIcons]}</div>`,
                      iconSize: [32, 32],
                      className: "custom-marker",
                    })}
                  >
                    <Popup>
                      <div className="max-w-xs">
                        <h3 className="font-semibold text-slate-900">{post.title}</h3>
                        <p className="text-sm text-slate-600">{post.city}, {post.state}</p>
                        <Button
                          onClick={() => {
                            setSelectedPost(post);
                            setShowModal(true);
                          }}
                          size="sm"
                          className="mt-2 w-full bg-blue-600"
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card>
          </div>

          {/* Sidebar - Ranking */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Top da Semana</h3>
                </div>
              </div>
              <div className="divide-y divide-slate-200">
                {topPosts.slice(0, 5).map((post, idx) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      setSelectedPost(post);
                      setShowModal(true);
                    }}
                    className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg font-bold text-blue-600 min-w-6">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{post.title}</p>
                        <p className="text-xs text-slate-500">{post.city}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                          <Heart className="w-3 h-3" />
                          <span>{post.upvotes}</span>
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal - Post Details */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-6">
              {selectedPost.imageUrl && (
                <img
                  src={selectedPost.imageUrl}
                  alt={selectedPost.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Autor:</span> {selectedPost.authorName}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Localização:</span> {selectedPost.city}, {selectedPost.state}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Categoria:</span> {selectedPost.category}
                </p>
              </div>

              {selectedPost.content && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-slate-700">{selectedPost.content}</p>
                </div>
              )}

              {selectedPost.category === "poll" && (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">Opções de Votação:</p>
                  {/* Poll options would be rendered here */}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleUpvote(selectedPost.id)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Upvote ({selectedPost.upvotes})
                </Button>
                <Button
                  onClick={() => handleShare(selectedPost)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </Button>
                {selectedPost.imageUrl && (
                  <>
                    <Button
                      onClick={() => handleDownload(selectedPost.imageUrl, "png")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PNG
                    </Button>
                    <Button
                      onClick={() => handleDownload(selectedPost.imageUrl, "sticker")}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Sticker
                    </Button>
                  </>
                )}
              </div>

              {/* Reactions */}
              <div className="flex gap-2">
                {["😂", "❤️", "😍", "🔥", "👏"].map((emoji) => (
                  <Button
                    key={emoji}
                    onClick={() => handleReaction(selectedPost.id, emoji)}
                    variant="outline"
                    size="sm"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Comentários ({selectedPost.commentCount})</h4>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                  {/* Comments would be listed here */}
                  <p className="text-sm text-slate-500">Sem comentários ainda</p>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Seu nome..." className="flex-1" />
                  <Input placeholder="Seu comentário..." className="flex-1" />
                  <Button size="sm" className="bg-blue-600">
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal - Submit Content */}
      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Conteúdo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900">Tipo de Conteúdo</label>
              <Select>
                <option value="meme">😂 Meme</option>
                <option value="poll">📊 Enquete</option>
                <option value="moment">⭐ Momento</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900">Título</label>
              <Input placeholder="Título do seu conteúdo..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900">Cidade</label>
              <Input placeholder="Sua cidade..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900">Descrição</label>
              <textarea className="w-full p-2 border border-slate-300 rounded-lg" rows={4} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSubmit(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600">Enviar para Moderação</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
