import { useRef } from 'react';
import { useEditorStore } from '../store/editorStore';

export function BackgroundImageUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { backgroundImage, backgroundOpacity, setBackgroundImage, setBackgroundOpacity } = useEditorStore();

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => { const result = e.target?.result; if (typeof result === 'string') setBackgroundImage(result); };
    reader.readAsDataURL(file);
  }

  return (
    <div className="p-3 border-t border-ha-border space-y-2">
      <p className="text-ha-muted text-xs uppercase tracking-wider font-semibold">Background Image</p>
      <div onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}
        className="border border-dashed border-ha-border rounded p-3 text-center cursor-pointer hover:border-ha-accent transition-colors">
        {backgroundImage ? (
          <div className="flex items-center gap-2">
            <img src={backgroundImage} alt="BG preview" className="w-10 h-10 object-cover rounded shrink-0" />
            <span className="text-ha-muted text-xs">Click to replace</span>
          </div>
        ) : <span className="text-ha-muted text-xs">Drop PNG/JPG/WebP or click to upload</span>}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      {backgroundImage && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-ha-muted text-xs w-14 shrink-0">Opacity</span>
            <input type="range" min={0} max={1} step={0.01} value={backgroundOpacity} onChange={(e) => setBackgroundOpacity(Number(e.target.value))} className="flex-1 accent-ha-accent" />
            <span className="text-ha-muted text-xs w-8 text-right">{Math.round(backgroundOpacity * 100)}%</span>
          </div>
          <button onClick={() => setBackgroundImage(undefined)} className="w-full text-xs text-red-400 hover:text-red-300 py-1">Remove image</button>
        </>
      )}
    </div>
  );
}
