/**
 * ChatLeadForm - Compact lead capture form for Chatbot (Phase 27)
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CrmService } from '@/services/crm.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Check from 'lucide-react/dist/esm/icons/check';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatLeadFormProps {
  pageId: string;
  userId: string;
  intent?: string;
  lastQuery?: string;
  onSuccess: (name: string) => void;
}

export const ChatLeadForm = ({ pageId, userId, intent, lastQuery, onSuccess }: ChatLeadFormProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setLoading(true);
    try {
      const { error } = await CrmService.createPublicLead({
        userId,
        name: formData.name,
        phone: formData.phone,
        source: 'chatbot',
        notes: `Lead from Expert Engine chat (Page ID: ${pageId})`,
        metadata: { 
          page_id: pageId, 
          chat_lead: true,
          intent,
          last_query: lastQuery
        }
      });

      if (error) throw error;

      setSent(true);
      setTimeout(() => onSuccess(formData.name), 1500);
    } catch (err) {
      console.error('Lead submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-3xl glass-card border-white/20 bg-white/5 shadow-2xl my-4"
    >
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.form 
            key="form"
            onSubmit={handleSubmit} 
            className="space-y-3"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <p className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-2 px-1">
              {t('chat.lead.title', 'Оставить заявку')}
            </p>
            
            <div className="space-y-2">
              <Input
                placeholder={t('chat.lead.name', 'Ваше имя')}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="h-10 rounded-xl glass-input text-sm transition-all"
              />
              <Input
                placeholder={t('chat.lead.phone', 'Телефон')}
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
                className="h-10 rounded-xl glass-input text-sm transition-all"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-glass transition-all active:scale-95"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('chat.lead.submit', 'Отправить')}
            </Button>
            
            <p className="text-[9px] text-center opacity-30 px-2 leading-tight">
              {t('chat.lead.disclaimer', 'Нажимая кнопку, вы соглашаетесь на обработку данных')}
            </p>
          </motion.form>
        ) : (
          <motion.div 
            key="success"
            className="flex flex-col items-center justify-center py-4 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-black text-emerald-500">{t('chat.lead.success', 'Заявка отправлена!')}</p>
            <p className="text-[11px] opacity-60 mt-1">{t('chat.lead.successMsg', 'С вами скоро свяжутся')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
