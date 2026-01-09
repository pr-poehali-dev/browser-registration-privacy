import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

const Browser = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState({ vpn: true, tracking: true, encryption: true });

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let formattedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      formattedUrl = "https://" + url;
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
      toast.success("Страница загружена", {
        description: "Соединение защищено",
      });
    }, 1500);
  };

  const quickLinks = [
    { name: "Google", url: "https://google.com", icon: "Search" },
    { name: "GitHub", url: "https://github.com", icon: "Github" },
    { name: "YouTube", url: "https://youtube.com", icon: "Play" },
    { name: "Wikipedia", url: "https://wikipedia.org", icon: "BookOpen" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
              <Icon name="RotateCw" size={20} />
            </Button>

            <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <Icon 
                  name={currentUrl ? "Lock" : "Globe"} 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-accent" 
                />
                <Input
                  type="text"
                  placeholder="Введите адрес сайта или поисковый запрос"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 pr-4 h-11"
                />
              </div>
              <Button type="submit" size="icon" className="h-11 w-11">
                <Icon name="ArrowRight" size={20} />
              </Button>
            </form>

            <div className="flex gap-2">
              <Button
                variant={securityStatus.vpn ? "default" : "outline"}
                size="icon"
                onClick={() => setSecurityStatus({ ...securityStatus, vpn: !securityStatus.vpn })}
                title="VPN"
              >
                <Icon name="Shield" size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/bookmarks")}>
                <Icon name="Star" size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
                <Icon name="History" size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Icon name="Settings" size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <Icon name="User" size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!currentUrl ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Добро пожаловать</h1>
              <p className="text-muted-foreground text-lg">
                Защищённый браузер с шифрованием и приватностью
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link) => (
                <Card
                  key={link.url}
                  className="p-6 hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => {
                    setUrl(link.url);
                    handleNavigate({ preventDefault: () => {} } as React.FormEvent);
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name={link.icon as any} size={24} className="text-primary" />
                    </div>
                    <span className="font-medium">{link.name}</span>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Icon name="ShieldCheck" size={24} className="text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Защита включена</h3>
                  <p className="text-sm text-muted-foreground">
                    VPN, блокировка трекеров и сквозное шифрование активны
                  </p>
                </div>
                <div className="flex gap-2">
                  {securityStatus.vpn && (
                    <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                      VPN
                    </div>
                  )}
                  {securityStatus.tracking && (
                    <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                      Защита
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <Card className="p-8 min-h-[600px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                  <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground">Загрузка страницы...</p>
                  <p className="text-sm text-muted-foreground">Соединение защищено</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Icon name="Lock" size={20} className="text-accent" />
                    <span className="font-medium">{currentUrl}</span>
                  </div>
                  <div className="text-center py-20">
                    <Icon name="Globe" size={64} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Контент сайта</p>
                    <p className="text-muted-foreground">
                      В реальном браузере здесь отображается содержимое веб-страницы
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browser;
