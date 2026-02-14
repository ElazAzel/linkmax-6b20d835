import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateVideoBlock } from '@/lib/block-validators';

function VideoBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
        />
      </div>
      
      <div>
        <Label>Video URL</Label>
        <Input
          type="url"
          placeholder="YouTube or Vimeo URL"
          value={formData.url || ''}
          onChange={(e) => onChange({ ...formData, url: e.target.value })}
        />
      </div>
      
      <div>
        <Label>Platform</Label>
        <Select
          value={formData.platform || 'youtube'}
          onValueChange={(value) => onChange({ ...formData, platform: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Aspect Ratio</Label>
        <Select
          value={formData.aspectRatio || '16:9'}
          onValueChange={(value) => onChange({ ...formData, aspectRatio: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export const VideoBlockEditor = withBlockEditor(VideoBlockEditorComponent, {
  hint: 'Embed YouTube or Vimeo videos with custom aspect ratios',
  validate: validateVideoBlock,
});
