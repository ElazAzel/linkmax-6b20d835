import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateNewsletterBlock } from '@/lib/block-validators';

function NewsletterBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="Subscribe to Newsletter"
        />
      </div>

      <div>
        <Label>Description (optional)</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          placeholder="Get the latest updates delivered to your inbox"
          rows={2}
        />
      </div>

      <div>
        <Label>Button Text</Label>
        <Input
          value={formData.buttonText || 'Subscribe'}
          onChange={(e) => onChange({ ...formData, buttonText: e.target.value })}
          placeholder="Subscribe"
        />
      </div>
    </div>
  );
}

export const NewsletterBlockEditor = withBlockEditor(NewsletterBlockEditorComponent, {
  hint: 'Add email newsletter subscription form',
  validate: validateNewsletterBlock,
  isPremium: true,
  description: 'Build your mailing list with newsletter subscription',
});
