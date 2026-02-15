import heroImage from "@/assets/hero-outdoor.jpg";

interface HeroBannerProps {
  title: string;
  children?: React.ReactNode;
  compact?: boolean;
}

export default function HeroBanner({ title, children, compact }: HeroBannerProps) {
  if (compact) {
    return (
      <div className="rounded-2xl bg-foreground/90 px-5 py-3 shadow-card">
        {children ? children : (
          <h1 className="text-lg font-semibold text-primary-foreground">{title}</h1>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-card">
      <img src={heroImage} alt="Mountain landscape" className="w-full h-44 md:h-52 object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {children ? children : (
          <h1 className="text-2xl font-semibold text-primary-foreground">{title}</h1>
        )}
      </div>
    </div>
  );
}
