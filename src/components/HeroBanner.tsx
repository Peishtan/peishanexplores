interface HeroBannerProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  compact?: boolean;
}

export default function HeroBanner({ title, subtitle, children, compact }: HeroBannerProps) {
  const now = new Date();
  const qNum = Math.floor(now.getMonth() / 3) + 1;
  const weekOfYear = Math.ceil(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 86400000)
  );

  if (compact) {
    return (
      <div className="relative h-[160px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(13,15,14,0.7)] to-background" 
             style={{ background: 'linear-gradient(180deg, transparent 20%, rgba(13,15,14,0.7) 70%, hsl(150 8% 5%) 100%), linear-gradient(135deg, #1a2e1c 0%, #0d1a10 40%, #0a1215 100%)' }} />
        <MountainSilhouette />
        <div className="relative z-[2] flex items-start justify-between px-6 pt-7">
          <span className="font-display text-[13px] font-normal uppercase tracking-[0.25em] text-mist opacity-70">
            PS FitTrackr
          </span>
          <span className="font-mono-dm text-[11px] tracking-[0.1em] text-fog">
            Q{qNum} · WK {weekOfYear} · {now.getFullYear()}
          </span>
        </div>
        <div className="absolute bottom-7 left-6 z-[2]">
          {children || (
            <>
              <h1 className="font-display text-[38px] font-black leading-none tracking-tight">{title}</h1>
              {subtitle && (
                <p className="font-mono-dm mt-1 text-[11px] uppercase tracking-[0.15em] text-moss-light">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[220px] overflow-hidden">
      <div className="absolute inset-0"
           style={{ background: 'linear-gradient(180deg, transparent 20%, rgba(13,15,14,0.7) 70%, hsl(150 8% 5%) 100%), linear-gradient(135deg, #1a2e1c 0%, #0d1a10 40%, #0a1215 100%)' }} />
      <MountainSilhouette />
      <div className="relative z-[2] flex items-start justify-between px-6 pt-7">
        <span className="font-display text-[13px] font-normal uppercase tracking-[0.25em] text-mist opacity-70">
          PS FitTrackr
        </span>
        <span className="font-mono-dm text-[11px] tracking-[0.1em] text-fog">
          Q{qNum} · WK {weekOfYear} · {now.getFullYear()}
        </span>
      </div>
      <div className="absolute bottom-7 left-6 z-[2]">
        {children || (
          <>
            <h1 className="font-display text-[38px] font-black leading-none tracking-tight">{title}</h1>
            {subtitle && (
              <p className="font-mono-dm mt-1 text-[11px] uppercase tracking-[0.15em] text-moss-light">
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MountainSilhouette() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[140px]"
         style={{
           background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 140' preserveAspectRatio='none'%3E%3Cpath d='M0 140 L0 80 L40 50 L80 70 L120 20 L160 55 L200 10 L240 45 L280 30 L320 60 L360 35 L400 55 L420 40 L420 140 Z' fill='%231a2e1c' opacity='0.8'/%3E%3Cpath d='M0 140 L0 100 L60 75 L100 90 L140 55 L180 75 L220 40 L260 65 L300 50 L340 70 L380 55 L420 65 L420 140 Z' fill='%230d1a10' opacity='0.9'/%3E%3C/svg%3E") no-repeat bottom center / cover`
         }} />
  );
}
