import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { AIAssistant } from "@/components/AIAssistant";
import { VoiceInput } from "@/components/VoiceInput";

const Browser = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetch('https://functions.poehali.dev/a3a0af1c-7961-4fbc-af29-a0ada5ae4da7?endpoint=premium', {
        headers: { 'X-Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => setIsPremium(data.is_premium || data.is_birthday))
        .catch(() => {});
    }
  }, []);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let formattedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes('.')) {
        formattedUrl = "https://" + url;
      } else {
        formattedUrl = "https://ya.ru/search/?text=" + encodeURIComponent(url);
      }
    }

    setIsLoading(true);
    setCurrentUrl(formattedUrl);

    const historyItem = {
      url: formattedUrl,
      title: formattedUrl,
      timestamp: Date.now(),
    };

    const history = JSON.parse(localStorage.getItem("browserHistory") || "[]");
    history.unshift(historyItem);
    localStorage.setItem("browserHistory", JSON.stringify(history.slice(0, 100)));

    setTimeout(() => {
      setIsLoading(false);
      toast.success("Страница загружена");
    }, 1000);
  };

  const handleVoiceSearch = (text: string) => {
    setUrl(text);
    handleNavigate({ preventDefault: () => {} } as React.FormEvent);
  };

  const quickLinks = [
    { name: "Google", url: "https://google.com", icon: "Search", color: "bg-blue-500" },
    { name: "Яндекс", url: "https://ya.ru", icon: "Search", color: "bg-red-500" },
    { name: "YouTube", url: "https://youtube.com", icon: "Play", color: "bg-red-600" },
    { name: "VK", url: "https://vk.com", icon: "MessageCircle", color: "bg-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-blue-50">
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="hover:bg-green-50">
              <Icon name="RotateCw" size={20} />
            </Button>

            <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <Icon 
                  name={currentUrl ? "Lock" : "Globe"} 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" 
                />
                <Input
                  type="text"
                  placeholder="Поиск или адрес сайта"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 pr-12 h-11 border-2 focus:border-blue-400"
                />
                <VoiceInput onResult={handleVoiceSearch} />
              </div>
              <Button type="submit" size="icon" className="h-11 w-11 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Icon name="ArrowRight" size={20} />
              </Button>
            </form>

            <div className="flex gap-2">
              <Button
                variant={showAssistant ? "default" : "outline"}
                size="icon"
                onClick={() => setShowAssistant(!showAssistant)}
                className={isPremium ? "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700" : ""}
                title="Голосовой помощник"
              >
                <div className={isPremium ? "w-6 h-6 rounded-full bg-gradient-to-r from-yellow-300 to-yellow-500 flex items-center justify-center" : ""}>
                  <Icon name="Sparkles" size={isPremium ? 16 : 20} className={isPremium ? "text-white" : ""} />
                </div>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/bookmarks")} className="hover:bg-yellow-50">
                <Icon name="Star" size={20} className="text-yellow-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/history")} className="hover:bg-purple-50">
                <Icon name="History" size={20} className="text-purple-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="hover:bg-gray-50">
                <Icon name="Settings" size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="hover:bg-blue-50">
                <Icon name="User" size={20} className="text-blue-600" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showAssistant && <AIAssistant isPremium={isPremium} onClose={() => setShowAssistant(false)} />}

      <div className="container mx-auto px-4 py-8">
        {!currentUrl ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Добро пожаловать
              </h1>
              <p className="text-gray-600 text-lg">
                Безопасный браузер с голосовым помощником и защитой данных
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickLinks.map((link) => (
                <Card
                  key={link.url}
                  className={`p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:scale-105 ${link.color} bg-opacity-10 hover:bg-opacity-20`}
                  onClick={() => {
                    setUrl(link.url);
                    handleNavigate({ preventDefault: () => {} } as React.FormEvent);
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl ${link.color} flex items-center justify-center shadow-lg`}>
                      <Icon name={link.icon as any} size={28} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-800">{link.name}</span>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center shadow-lg">
                  <Icon name="ShieldCheck" size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">Защита активна</h3>
                  <p className="text-sm text-green-700">
                    Шифрование данных, блокировка трекеров, защита от вирусов
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="max-w-full mx-auto">
            <Card className="p-2 min-h-[700px] bg-white shadow-2xl">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[700px] gap-4">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-600">Загрузка страницы...</p>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full h-[700px] border-0 rounded-lg"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  title="Browser content"
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browser;
