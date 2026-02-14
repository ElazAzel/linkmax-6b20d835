import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateScratchBlock } from '@/lib/block-validators';

function ScratchBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title (optional)</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="Scratch to Reveal"
        />
      </div>

      <div>
        <Label>Hidden Text/Prize</Label>
        <Textarea
          value={formData.revealText || ''}
          onChange={(e) => onChange({ ...formData, revealText: e.target.value })}
          placeholder="🎉 You won 20% discount!"
          rows={2}
        />
      </div>

      <div>
        <Label>Background Color (optional)</Label>
        <Input
          type="color"
          value={formData.backgroundColor || '#C0C0C0'}
          onChange={(e) => onChange({ ...formData, backgroundColor: e.target.value })}
        />
      </div>
    </div>
  );
}

export const ScratchBlockEditor = withBlockEditor(ScratchBlockEditorComponent, {
  hint: 'Create an interactive scratch card with hidden text/prizes',
  validate: validateScratchBlock,
  isPremium: true,
  description: 'Engage visitors with a gamified scratch-to-reveal experience',
});
