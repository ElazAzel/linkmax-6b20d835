import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Link2, 
  Image, 
  Type, 
  Trash2, 
  GripVertical,
  Plus,
  Sparkles,
  Check,
  Instagram,
  Youtube,
  Twitter
} from 'lucide-react';

interface DemoBlock {
  id: string;
  type: 'link' | 'image' | 'text' | 'socials';
  content: string;
  emoji?: string;
  gradient?: string;
}

const gradients = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
];

const emojis = ['🔗', '🎨', '📸', '🎵', '💼', '🚀', '⭐', '💡'];

export function InteractiveDemo() {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState<DemoBlock[]>([
    { id: '1', type: 'link', content: 'My Portfolio', emoji: '🎨', gradient: 'from-violet-500 to-purple-600' },
    { id: '2', type: 'link', content: 'Contact Me', emoji: '📧', gradient: 'from-blue-500 to-cyan-500' },
  ]);
  const [profileName, setProfileName] = useState('Your Name');
  const [profileBio, setProfileBio] = useState('Digital Creator');
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  const addBlock = (type: DemoBlock['type']) => {
    const newBlock: DemoBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'link' ? 'New Link' : type === 'text' ? 'Your text here' : 'Image',
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      gradient: gradients[Math.floor(Math.random() * gradients.length)],
    };
    setBlocks([...blocks, newBlock]);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const handleDragStart = (id: string) => {
    setDraggedBlock(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedBlock || draggedBlock === targetId) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedBlock);
    const targetIndex = blocks.findIndex(b => b.id === targetId);
    
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, removed);
    setBlocks(newBlocks);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  return (
    <section className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-14 lg:mb-20 space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-primary">{t('landing.demo.badge', 'Try it now')}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold tracking-[-0.02em] leading-tight">
            {t('landing.demo.title', 'Experience the Magic.')}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto font-normal">
            {t('landing.demo.subtitle', 'Play with the editor right here. Add blocks, edit content, and see changes in real-time.')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Editor Panel */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/50 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <Type className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {t('landing.demo.profile', 'Profile')}
              </h3>
              <div className="space-y-2.5 sm:space-y-3">
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-xl h-11 sm:h-12 text-base"
                />
                <Input
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Your bio"
                  className="rounded-xl h-11 sm:h-12 text-base"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/50 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {t('landing.demo.addBlocks', 'Add Blocks')}
              </h3>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <Button
                  variant="outline"
                  className="flex-col h-auto py-3 sm:py-4 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95"
                  onClick={() => addBlock('link')}
                >
                  <Link2 className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1 text-primary" />
                  <span className="text-[10px] sm:text-xs">{t('landing.demo.link', 'Link')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-3 sm:py-4 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95"
                  onClick={() => addBlock('text')}
                >
                  <Type className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1 text-primary" />
                  <span className="text-[10px] sm:text-xs">{t('landing.demo.text', 'Text')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-3 sm:py-4 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95"
                  onClick={() => addBlock('image')}
                >
                  <Image className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1 text-primary" />
                  <span className="text-[10px] sm:text-xs">{t('landing.demo.image', 'Image')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-3 sm:py-4 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95"
                  onClick={() => addBlock('socials')}
                >
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1 text-primary" />
                  <span className="text-[10px] sm:text-xs">{t('landing.demo.socials', 'Socials')}</span>
                </Button>
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/50 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {t('landing.demo.yourBlocks', 'Your Blocks')}
                <span className="text-xs text-muted-foreground font-normal hidden sm:inline">
                  ({t('landing.demo.dragToReorder', 'drag to reorder')})
                </span>
              </h3>
              <div className="space-y-2 min-h-[80px] sm:min-h-[100px]">
                {blocks.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                    {t('landing.demo.noBlocks', 'No blocks yet. Add some above!')}
                  </div>
                ) : (
                  blocks.map((block) => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => handleDragStart(block.id)}
                      onDragOver={(e) => handleDragOver(e, block.id)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group ${
                        draggedBlock === block.id ? 'opacity-50 scale-95' : ''
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br ${block.gradient} flex items-center justify-center text-white text-xs sm:text-sm flex-shrink-0`}>
                        {block.emoji}
                      </div>
                      {editingBlock === block.id ? (
                        <Input
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, e.target.value)}
                          onBlur={() => setEditingBlock(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingBlock(null)}
                          autoFocus
                          className="flex-1 h-8 text-sm"
                        />
                      ) : (
                        <span 
                          className="flex-1 text-xs sm:text-sm truncate cursor-text"
                          onClick={() => setEditingBlock(block.id)}
                        >
                          {block.content}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteBlock(block.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Phone Preview */}
          <div className="flex justify-center order-1 lg:order-2 lg:sticky lg:top-24">
            <div className="relative">
              {/* Live badge */}
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500 text-white text-[10px] sm:text-xs font-medium shadow-lg">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white"></span>
                </span>
                {t('landing.demo.livePreview', 'Live Preview')}
              </div>

              {/* Phone frame */}
              <div className="relative w-[260px] sm:w-[300px] lg:w-[320px] h-[500px] sm:h-[560px] lg:h-[600px] bg-foreground rounded-[2.5rem] sm:rounded-[3rem] p-2.5 sm:p-3 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-5 sm:h-7 bg-foreground rounded-b-xl sm:rounded-b-2xl z-10" />
                
                <div className="relative h-full w-full bg-background rounded-[2rem] sm:rounded-[2.25rem] overflow-hidden">
                  <div className="h-full overflow-y-auto scrollbar-hide p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {/* Profile */}
                    <div className="pt-6 sm:pt-8 flex flex-col items-center space-y-2.5 sm:space-y-3">
                      <div className="relative">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-primary to-blue-600 p-0.5">
                          <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                            <span className="text-xl sm:text-2xl">👤</span>
                          </div>
                        </div>
                        <div className="absolute -bottom-0.5 sm:-bottom-1 -right-0.5 sm:-right-1 h-5 w-5 sm:h-6 sm:w-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-base sm:text-lg">{profileName || 'Your Name'}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{profileBio || 'Digital Creator'}</p>
                      </div>
                    </div>

                    {/* Blocks */}
                    <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                      {blocks.map((block, index) => (
                        <div
                          key={block.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {block.type === 'link' && (
                            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${block.gradient} text-white text-center font-medium text-sm sm:text-base shadow-lg active:scale-[0.98] transition-transform cursor-pointer`}>
                              {block.emoji} {block.content}
                            </div>
                          )}
                          {block.type === 'text' && (
                            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-card border border-border text-center text-sm sm:text-base">
                              {block.content}
                            </div>
                          )}
                          {block.type === 'image' && (
                            <div className="aspect-video rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center">
                              <Image className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                            </div>
                          )}
                          {block.type === 'socials' && (
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                              <div className="aspect-square rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer">
                                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                              <div className="aspect-square rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer">
                                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                              <div className="aspect-square rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer">
                                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {blocks.length === 0 && (
                        <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
                          {t('landing.demo.addBlocksHint', 'Add blocks to see them here')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect - reduced on mobile for performance */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 sm:from-primary/30 via-blue-500/15 sm:via-blue-500/20 to-purple-500/20 sm:to-purple-500/30 rounded-[2.5rem] sm:rounded-[3rem] blur-2xl sm:blur-3xl opacity-40 sm:opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
