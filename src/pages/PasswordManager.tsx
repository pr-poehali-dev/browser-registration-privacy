import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const PasswordManager = () => {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState<any[]>([]);
  const [newPassword, setNewPassword] = useState({ site_url: "", site_name: "", username: "", password: "" });
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadPasswords();
  }, []);

  const loadPasswords = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error("Необходима авторизация");
      navigate('/');
      return;
    }

    try {
      const res = await fetch('https://functions.poehali.dev/f3a3b6e2-b4ed-4905-911f-d0fcb782154d', {
        headers: { 'X-Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPasswords(data.passwords || []);
    } catch (error) {
      toast.error("Ошибка загрузки паролей");
    }
  };

  const savePassword = async () => {
    const token = localStorage.getItem('accessToken');
    if (!newPassword.site_url || !newPassword.password) {
      toast.error("Заполните URL и пароль");
      return;
    }

    try {
      await fetch('https://functions.poehali.dev/f3a3b6e2-b4ed-4905-911f-d0fcb782154d', {
        method: 'POST',
        headers: { 'X-Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newPassword)
      });
      
      toast.success("Пароль сохранён");
      setNewPassword({ site_url: "", site_name: "", username: "", password: "" });
      loadPasswords();
    } catch (error) {
      toast.error("Ошибка сохранения");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <h1 className="text-3xl font-bold">Менеджер паролей</h1>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить пароль
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый пароль</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>URL сайта *</Label>
                  <Input value={newPassword.site_url} onChange={(e) => setNewPassword({...newPassword, site_url: e.target.value})} placeholder="https://example.com" />
                </div>
                <div>
                  <Label>Название</Label>
                  <Input value={newPassword.site_name} onChange={(e) => setNewPassword({...newPassword, site_name: e.target.value})} placeholder="Мой сайт" />
                </div>
                <div>
                  <Label>Логин</Label>
                  <Input value={newPassword.username} onChange={(e) => setNewPassword({...newPassword, username: e.target.value})} placeholder="user@example.com" />
                </div>
                <div>
                  <Label>Пароль *</Label>
                  <Input type="password" value={newPassword.password} onChange={(e) => setNewPassword({...newPassword, password: e.target.value})} placeholder="••••••••" />
                </div>
                <Button onClick={savePassword} className="w-full">Сохранить</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {passwords.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                    <Icon name="Lock" size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{p.site_name || p.site_url}</h3>
                    <p className="text-sm text-gray-600">{p.username}</p>
                    <p className="text-sm font-mono">{showPasswords[p.id] ? p.password : '••••••••'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setShowPasswords({...showPasswords, [p.id]: !showPasswords[p.id]})}>
                    <Icon name={showPasswords[p.id] ? "EyeOff" : "Eye"} size={18} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => {navigator.clipboard.writeText(p.password); toast.success("Скопировано");}}>
                    <Icon name="Copy" size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {passwords.length === 0 && (
            <Card className="p-12 text-center">
              <Icon name="Lock" size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Паролей пока нет</h3>
              <p className="text-gray-600">Добавьте первый пароль для безопасного хранения</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordManager;
