import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateSearchBlock } from '@/lib/block-validators';

function SearchBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title (optional)</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="Ask me anything"
        />
      </div>

      <div>
        <Label>Placeholder Text</Label>
        <Input
          value={formData.placeholder || 'Ask a question...'}
          onChange={(e) => onChange({ ...formData, placeholder: e.target.value })}
          placeholder="Ask a question..."
        />
      </div>
    </div>
  );
}

export const SearchBlockEditor = withBlockEditor(SearchBlockEditorComponent, {
  hint: 'AI-powered search that answers questions using Google Search',
  validate: validateSearchBlock,
  isPremium: true,
  description: 'Enable real-time internet search with AI-powered answers',
});
