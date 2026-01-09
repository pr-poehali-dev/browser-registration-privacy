import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export const VoiceInput = ({ onResult }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Голосовой ввод не поддерживается браузером");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Говорите...", { duration: 2000 });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      toast.success(`Распознано: ${transcript}`);
    };

    recognition.onerror = () => {
      toast.error("Ошибка распознавания речи");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`absolute right-2 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}
      onClick={startListening}
      title="Голосовой ввод"
    >
      <Icon name={isListening ? "MicOff" : "Mic"} size={18} />
    </Button>
  );
};
