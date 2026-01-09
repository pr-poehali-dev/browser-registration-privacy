import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "verification" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    toast.success("Код подтверждения отправлен");
    setStep("verification");
  };

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Введите 6-значный код");
      return;
    }
    toast.success("Код подтверждён");
    setStep("name");
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2) {
      toast.error("Введите ваше имя");
      return;
    }
    localStorage.setItem("userName", name);
    localStorage.setItem("userPhone", phone);
    toast.success("Регистрация завершена");
    navigate("/browser");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Icon name="Shield" size={32} className="text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold">Защищённый браузер</CardTitle>
          <CardDescription>
            {step === "phone" && "Введите номер телефона для регистрации"}
            {step === "verification" && "Введите код подтверждения"}
            {step === "name" && "Как к вам обращаться?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (900) 123-45-67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button type="submit" className="w-full">
                Получить код
                <Icon name="ArrowRight" size={18} className="ml-2" />
              </Button>
            </form>
          )}

          {step === "verification" && (
            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Код подтверждения</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-lg text-center tracking-widest"
                  maxLength={6}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Код отправлен на {phone}
                </p>
              </div>
              <Button type="submit" className="w-full">
                Подтвердить
                <Icon name="CheckCircle" size={18} className="ml-2" />
              </Button>
            </form>
          )}

          {step === "name" && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ваше имя</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Иван"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button type="submit" className="w-full">
                Завершить регистрацию
                <Icon name="UserCheck" size={18} className="ml-2" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
