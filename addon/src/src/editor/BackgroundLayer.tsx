import { useEffect, useState } from 'react';
import { Layer, Image as KonvaImage, Rect } from 'react-konva';

interface Props {
  width: number;
  height: number;
  backgroundImage: string | undefined;
  backgroundOpacity: number;
}

export function BackgroundLayer({ width, height, backgroundImage, backgroundOpacity }: Props) {
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!backgroundImage) {
      setImgElement(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => setImgElement(img);
    img.onerror = () => setImgElement(null);
    img.src = backgroundImage;
  }, [backgroundImage]);

  return (
    <Layer listening={false}>
      {/* Canvas background fill */}
      <Rect x={0} y={0} width={width} height={height} fill="#0d1117" />
      {/* Background reference image — only rendered once img is loaded */}
      {imgElement && (
        <KonvaImage
          image={imgElement}
          x={0}
          y={0}
          width={width}
          height={height}
          opacity={backgroundOpacity}
          listening={false}
        />
      )}
    </Layer>
  );
}
