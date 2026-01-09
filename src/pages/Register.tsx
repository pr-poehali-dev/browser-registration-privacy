import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [randomCode, setRandomCode] = useState("");

  const handleVKLogin = async () => {
    try {
      const res = await fetch('https://functions.poehali.dev/a3a0af1c-7961-4fbc-af29-a0ada5ae4da7?endpoint=vk-login');
      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch (error) {
      toast.error("Ошибка подключения к VK");
    }
  };

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      toast.error("Введите корректный email");
      return;
    }

    try {
      const res = await fetch('https://functions.poehali.dev/a3a0af1c-7961-4fbc-af29-a0ada5ae4da7?endpoint=email-send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      setRandomCode(data.code_for_demo || '123456');
      setShowCode(true);
      toast.success("Код отправлен на email");
    } catch (error) {
      toast.error("Ошибка отправки кода");
    }
  };

  const handleVerifyCode = async () => {
    try {
      const res = await fetch('https://functions.poehali.dev/a3a0af1c-7961-4fbc-af29-a0ada5ae4da7?endpoint=email-verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      
      const data = await res.json();
      if (data.message === 'Code verified') {
        toast.success("Код подтверждён!");
        return true;
      }
      toast.error("Неверный код");
      return false;
    } catch (error) {
      toast.error("Ошибка проверки кода");
      return false;
    }
  };

  const handleRegister = async () => {
    if (!password || password.length < 6) {
      toast.error("Пароль минимум 6 символов");
      return;
    }

    const verified = await handleVerifyCode();
    if (!verified) return;

    try {
      const res = await fetch('https://functions.poehali.dev/a3a0af1c-7961-4fbc-af29-a0ada5ae4da7?endpoint=email-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        toast.success("Регистрация успешна!");
        navigate('/browser');
      }
    } catch (error) {
      toast.error("Ошибка регистрации");
    }
  };

  const handleNoCode = () => {
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setRandomCode(generated);
    toast.info(`Ваш код: ${generated}`, { duration: 10000 });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Icon name="Globe" size={32} className="text-white" />
          </div>
          <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Браузер
          </CardTitle>
          <CardDescription>
            Безопасный браузер с голосовым помощником
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="vk" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vk">VK ID</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="vk" className="space-y-4">
              <Button 
                onClick={handleVKLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Icon name="MessageCircle" size={20} className="mr-2" />
                Войти через VK ID
              </Button>
              <p className="text-xs text-center text-gray-600">
                Быстрый вход через аккаунт ВКонтакте
              </p>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <Label>Имя (необязательно)</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Ваше имя"
                  />
                </div>

                <div>
                  <Label>Пароль</Label>
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Минимум 6 символов"
                  />
                </div>

                {!showCode ? (
                  <>
                    <Button onClick={handleSendCode} className="w-full">
                      Отправить код на email
                    </Button>
                    <Button 
                      onClick={handleNoCode} 
                      variant="outline" 
                      className="w-full"
                    >
                      У меня нет кода
                    </Button>
                  </>
                ) : (
                  <>
                    {randomCode && (
                      <Card className="p-3 bg-yellow-50 border-yellow-200">
                        <p className="text-sm text-center">
                          <strong>Ваш код:</strong> <span className="text-xl font-mono">{randomCode}</span>
                        </p>
                      </Card>
                    )}
                    <div>
                      <Label>Код подтверждения</Label>
                      <Input 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                        placeholder="123456"
                        maxLength={6}
                      />
                    </div>
                    <Button onClick={handleRegister} className="w-full">
                      Зарегистрироваться
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
