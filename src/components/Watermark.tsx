interface WatermarkProps {
  name: string;
  email: string;
}

export function Watermark({ name, email }: WatermarkProps) {
  const watermarkText = `${name} • ${email}`;
  
  return (
    <div className="watermark">
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-32 -rotate-45 scale-150">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="watermark-text">
            {watermarkText}
          </span>
        ))}
      </div>
    </div>
  );
}
