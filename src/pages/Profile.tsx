import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("userName") || "";
    const savedPhone = localStorage.getItem("userPhone") || "";
    const savedEmail = localStorage.getItem("userEmail") || "";
    setName(savedName);
    setPhone(savedPhone);
    setEmail(savedEmail);
  }, []);

  const handleSave = () => {
    localStorage.setItem("userName", name);
    localStorage.setItem("userPhone", phone);
    localStorage.setItem("userEmail", email);
    setIsEditing(false);
    toast.success("Профиль обновлён");
  };

  const handleLogout = () => {
    if (confirm("Выйти из аккаунта?")) {
      localStorage.clear();
      toast.success("Вы вышли из системы");
      navigate("/");
    }
  };

  const getInitials = () => {
    if (!name) return "У";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = [
    {
      icon: "History",
      label: "Посещено сайтов",
      value: JSON.parse(localStorage.getItem("browserHistory") || "[]").length,
    },
    {
      icon: "Star",
      label: "Закладок",
      value: JSON.parse(localStorage.getItem("bookmarks") || "[]").length,
    },
    {
      icon: "Shield",
      label: "Защита активна",
      value: Object.values(JSON.parse(localStorage.getItem("securitySettings") || "{}")).filter(Boolean).length,
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
            <h1 className="text-2xl font-semibold">Профиль</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold">{name || "Пользователь"}</h2>
                  <p className="text-muted-foreground">{phone}</p>
                </div>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                >
                  <Icon name={isEditing ? "Save" : "Edit"} size={18} className="mr-2" />
                  {isEditing ? "Сохранить" : "Редактировать"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/50">
                    <Icon name={stat.icon as any} size={24} className="mx-auto text-accent mb-2" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Данные аккаунта</CardTitle>
              <CardDescription>Управление личной информацией</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (опционально)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  placeholder="email@example.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="ShieldCheck" size={20} className="text-accent" />
                Безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate("/settings")}
              >
                <Icon name="Settings" size={18} className="mr-2" />
                Настройки безопасности
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  toast.success("Функция в разработке");
                }}
              >
                <Icon name="KeyRound" size={18} className="mr-2" />
                Изменить пароль
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  toast.info("Сеанс активен на этом устройстве");
                }}
              >
                <Icon name="Smartphone" size={18} className="mr-2" />
                Активные сеансы
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Помощь и поддержка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Icon name="HelpCircle" size={18} className="mr-2" />
                Центр помощи
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Icon name="Mail" size={18} className="mr-2" />
                Связаться с поддержкой
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Icon name="FileText" size={18} className="mr-2" />
                Политика конфиденциальности
              </Button>
            </CardContent>
          </Card>

          <Separator />

          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти из аккаунта
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
