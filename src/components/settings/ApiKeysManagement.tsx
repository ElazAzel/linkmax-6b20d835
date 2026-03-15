import { useState } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const ApiKeysManagement = () => {
  const { t } = useTranslation();
  const { keys, isLoading, generateKey, isGenerating, deleteKey } = useApiKeys();
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleGenerate = async () => {
    if (!newKeyName.trim()) {
      toast.error(t("settings.integrations.apiKeyNameRequired", "Enter a name for the API key"));
      return;
    }
    try {
      const result = await generateKey(newKeyName);
      setGeneratedKey(result.key);
      setNewKeyName("");
      setShowKey(true);
    } catch (error) {
      // Error handled by hook
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("common.copied"));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          {t("settings.integrations.apiKeys", "API Keys")}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t("settings.integrations.apiKeysDesc", "Use these keys to access the LinkMAX API from external services like Zapier or Make.")}
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={t("settings.integrations.apiKeyNamePlaceholder", "e.g. Zapier Integration")}
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="h-10"
        />
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          size="sm"
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("common.create")}
        </Button>
      </div>

      <AnimatePresence>
        {generatedKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 bg-primary/5 border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase">
                  {t("settings.integrations.newKeyGenerated", "New API Key Generated")}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setGeneratedKey(null)}>✕</Button>
              </div>
              <p className="text-xs text-amber-600 font-medium">
                {t("settings.integrations.apiKeyWarning", "Copy this key now. You won't be able to see it again!")}
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={showKey ? generatedKey : "•".repeat(32)}
                  className="font-mono text-sm h-9 bg-background"
                />
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(generatedKey)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">Loading keys...</div>
        ) : keys?.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground text-sm">
            {t("settings.integrations.noApiKeys", "No API keys generated yet")}
          </div>
        ) : (
          keys?.map((key) => (
            <div 
              key={key.id}
              className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{key.name}</span>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-wider">
                    {key.key_prefix}...
                  </code>
                  <span className="text-[10px] text-muted-foreground">
                    {t("common.created")}: {new Date(key.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteKey(key.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="pt-2">
        <Button variant="link" className="h-auto p-0 text-xs text-primary flex items-center gap-1" asChild>
          <a href="/docs/api" target="_blank">
            <ExternalLink className="h-3 w-3" />
            {t("settings.integrations.viewApiDocs", "View API Documentation")}
          </a>
        </Button>
      </div>
    </div>
  );
};
