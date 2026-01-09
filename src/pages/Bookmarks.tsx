import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

interface Bookmark {
  id: number;
  title: string;
  url: string;
  category: string;
}

const Bookmarks = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [newBookmark, setNewBookmark] = useState({ title: "", url: "", category: "Общее" });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    setBookmarks(saved);
  }, []);

  const addBookmark = () => {
    if (!newBookmark.title || !newBookmark.url) {
      toast.error("Заполните все поля");
      return;
    }

    const bookmark: Bookmark = {
      id: Date.now(),
      ...newBookmark,
    };

    const updated = [...bookmarks, bookmark];
    setBookmarks(updated);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
    toast.success("Закладка добавлена");
    setNewBookmark({ title: "", url: "", category: "Общее" });
    setIsOpen(false);
  };

  const deleteBookmark = (id: number) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("bookmarks", JSON.stringify(updated));
    toast.success("Закладка удалена");
  };

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(bookmarks.map((b) => b.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/browser")}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <h1 className="text-2xl font-semibold">Закладки</h1>
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
                placeholder="Поиск закладок..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая закладка</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input
                      value={newBookmark.title}
                      onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                      placeholder="Google"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      value={newBookmark.url}
                      onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                      placeholder="https://google.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Input
                      value={newBookmark.category}
                      onChange={(e) => setNewBookmark({ ...newBookmark, category: e.target.value })}
                      placeholder="Работа"
                    />
                  </div>
                  <Button onClick={addBookmark} className="w-full">
                    Сохранить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {bookmarks.length === 0 ? (
            <Card className="p-12 text-center">
              <Icon name="Star" size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет закладок</h3>
              <p className="text-muted-foreground mb-4">Добавьте важные сайты в избранное</p>
              <Button onClick={() => setIsOpen(true)}>
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить первую закладку
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => {
                const categoryBookmarks = filteredBookmarks.filter((b) => b.category === category);
                return categoryBookmarks.length > 0 ? (
                  <div key={category} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground px-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryBookmarks.map((bookmark) => (
                        <Card
                          key={bookmark.id}
                          className="p-4 hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <Icon name="Star" size={20} className="text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{bookmark.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{bookmark.url}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(bookmark.url, "_blank")}
                              >
                                <Icon name="ExternalLink" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteBookmark(bookmark.id)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;
