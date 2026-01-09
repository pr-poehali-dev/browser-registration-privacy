import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

interface HistoryItem {
  url: string;
  title: string;
  timestamp: number;
}

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("browserHistory") || "[]");
    setHistory(savedHistory);
  }, []);

  const filteredHistory = history.filter(
    (item) =>
      item.url.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase())
  );

  const clearHistory = () => {
    localStorage.setItem("browserHistory", "[]");
    setHistory([]);
    toast.success("История очищена");
  };

  const deleteItem = (timestamp: number) => {
    const updated = history.filter((item) => item.timestamp !== timestamp);
    localStorage.setItem("browserHistory", JSON.stringify(updated));
    setHistory(updated);
    toast.success("Запись удалена");
  };

  const groupByDate = (items: HistoryItem[]) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = today - 86400000;

    const groups: { [key: string]: HistoryItem[] } = {
      Сегодня: [],
      Вчера: [],
      Ранее: [],
    };

    items.forEach((item) => {
      const itemDate = new Date(item.timestamp).setHours(0, 0, 0, 0);
      if (itemDate === today) groups["Сегодня"].push(item);
      else if (itemDate === yesterday) groups["Вчера"].push(item);
      else groups["Ранее"].push(item);
    });

    return groups;
  };

  const groupedHistory = groupByDate(filteredHistory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/browser")}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <h1 className="text-2xl font-semibold">История просмотров</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск в истории..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={clearHistory}>
              <Icon name="Trash2" size={18} className="mr-2" />
              Очистить
            </Button>
          </div>

          {history.length === 0 ? (
            <Card className="p-12 text-center">
              <Icon name="History" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">История пуста</h3>
              <p className="text-muted-foreground">Посещённые сайты будут отображаться здесь</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([date, items]) =>
                items.length > 0 ? (
                  <div key={date} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground px-2">{date}</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <Card
                          key={item.timestamp}
                          className="p-4 hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon name="Globe" size={20} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(item.timestamp).toLocaleString("ru-RU")}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  navigate("/browser");
                                  setTimeout(() => {
                                    window.location.href = item.url;
                                  }, 100);
                                }}
                              >
                                <Icon name="ExternalLink" size={18} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteItem(item.timestamp)}
                              >
                                <Icon name="X" size={18} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
