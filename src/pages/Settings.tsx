import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

interface SecuritySettings {
  vpnEnabled: boolean;
  antiTracking: boolean;
  encryption: boolean;
  twoFactor: boolean;
  autoDelete: boolean;
  dnsProtection: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SecuritySettings>({
    vpnEnabled: true,
    antiTracking: true,
    encryption: true,
    twoFactor: false,
    autoDelete: false,
    dnsProtection: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("securitySettings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSetting = (key: keyof SecuritySettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem("securitySettings", JSON.stringify(updated));
    toast.success("Настройка обновлена");
  };

  const securityItems = [
    {
      key: "vpnEnabled" as keyof SecuritySettings,
      icon: "Shield",
      title: "VPN-шифрование",
      description: "Скрывает ваш IP-адрес и местоположение",
      critical: true,
    },
    {
      key: "antiTracking" as keyof SecuritySettings,
      icon: "Eye",
      title: "Защита от отслеживания",
      description: "Блокирует трекеры и рекламные сети",
      critical: true,
    },
    {
      key: "encryption" as keyof SecuritySettings,
      icon: "Lock",
      title: "Сквозное шифрование",
      description: "Шифрует все данные при передаче",
      critical: true,
    },
    {
      key: "twoFactor" as keyof SecuritySettings,
      icon: "KeyRound",
      title: "Двухфакторная аутентификация",
      description: "Дополнительный уровень защиты аккаунта",
      critical: false,
    },
    {
      key: "autoDelete" as keyof SecuritySettings,
      icon: "Trash2",
      title: "Автоудаление истории",
      description: "Автоматически очищает историю при выходе",
      critical: false,
    },
    {
      key: "dnsProtection" as keyof SecuritySettings,
      icon: "Server",
      title: "Защищённый DNS",
      description: "Использует зашифрованные DNS-запросы",
      critical: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/browser")}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <h1 className="text-2xl font-semibold">Настройки безопасности</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="ShieldCheck" size={24} className="text-accent" />
                Общий уровень защиты
              </CardTitle>
              <CardDescription>
                {Object.values(settings).filter(Boolean).length} из {Object.keys(settings).length} функций активно
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div
                    className="bg-accent h-full rounded-full transition-all"
                    style={{
                      width: `${(Object.values(settings).filter(Boolean).length / Object.keys(settings).length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round((Object.values(settings).filter(Boolean).length / Object.keys(settings).length) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Функции безопасности</CardTitle>
              <CardDescription>
                Настройте уровень защиты и приватности
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {securityItems.map((item, index) => (
                <div key={item.key}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      settings[item.key] ? "bg-accent/10" : "bg-muted"
                    }`}>
                      <Icon
                        name={item.icon as any}
                        size={20}
                        className={settings[item.key] ? "text-accent" : "text-muted-foreground"}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={item.key} className="font-medium cursor-pointer">
                          {item.title}
                        </Label>
                        {item.critical && (
                          <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium">
                            Критично
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      id={item.key}
                      checked={settings[item.key]}
                      onCheckedChange={(checked) => updateSetting(item.key, checked)}
                    />
                  </div>
                  {index < securityItems.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Дополнительные функции</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/passwords")}
              >
                <Icon name="Key" size={18} className="mr-2" />
                Менеджер паролей
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/profile")}
              >
                <Icon name="FileText" size={18} className="mr-2" />
                Хранилище документов
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/profile")}
              >
                <Icon name="Crown" size={18} className="mr-2" />
                Премиум подписка
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => toast.info("Напишите нам: support@browser.com")}
              >
                <Icon name="MessageCircle" size={18} className="mr-2" />
                Поддержка
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="AlertTriangle" size={20} />
                Опасная зона
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  localStorage.removeItem("browserHistory");
                  toast.success("История удалена");
                }}
              >
                <Icon name="Trash2" size={18} className="mr-2" />
                Удалить всю историю просмотров
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  localStorage.removeItem("bookmarks");
                  toast.success("Закладки удалены");
                }}
              >
                <Icon name="Star" size={18} className="mr-2" />
                Удалить все закладки
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm("Вы уверены? Все данные будут удалены.")) {
                    localStorage.clear();
                    toast.success("Данные удалены");
                    navigate("/");
                  }
                }}
              >
                <Icon name="AlertTriangle" size={18} className="mr-2" />
                Сбросить все настройки
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;