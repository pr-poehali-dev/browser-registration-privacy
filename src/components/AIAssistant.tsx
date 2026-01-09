import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

interface AIAssistantProps {
  isPremium: boolean;
  onClose: () => void;
}

export const AIAssistant = ({ isPremium, onClose }: AIAssistantProps) => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('https://functions.poehali.dev/9c3d2126-c1d0-42ba-8b4d-6d58875b60cb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, is_premium: isPremium })
      });
      
      const data = await res.json();
      setResponse(data.response);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.lang = 'ru-RU';
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      toast.error("Ошибка связи с помощником");
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Голосовой ввод не поддерживается");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleQuery();
    };

    recognition.onerror = () => {
      toast.error("Ошибка распознавания");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-2xl p-6 space-y-4 ${isPremium ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-yellow-400' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPremium ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'} shadow-lg`}>
              <Icon name="Sparkles" size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{isPremium ? '✨ Премиум помощник' : 'Голосовой помощник'}</h3>
              <p className="text-sm text-gray-600">Задайте любой вопрос</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: погода в Москве, сколько будет 15+25..."
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              className="flex-1"
            />
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={startVoiceInput}
              className={isListening ? "animate-pulse" : ""}
            >
              <Icon name="Mic" size={20} />
            </Button>
            <Button onClick={handleQuery} disabled={isLoading}>
              {isLoading ? "Думаю..." : "Спросить"}
            </Button>
          </div>

          {response && (
            <Card className={`p-4 ${isPremium ? 'bg-white border-2 border-yellow-300' : 'bg-gray-50'}`}>
              <p className="text-gray-800">{response}</p>
            </Card>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Возможности:</strong></p>
          <p>• Погода для: Москва, Санкт-Петербург, Шушары</p>
          <p>• Математика: примеры, вычисления</p>
          {isPremium && <p className="text-yellow-700 font-semibold">• Расширенный поиск и анализ (GPT-4)</p>}
        </div>
      </Card>
    </div>
  );
};
