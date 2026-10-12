export interface VideoAdItem {
  id: string;
  format: 'preroll' | 'midroll' | 'shorts_sponsored' | 'feed_native' | 'rewarded';
  advertiserName: string;
  advertiserLogo: string;
  headline: string;
  tagline: string;
  displayUrl: string;
  ctaText: string;
  destinationUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  skipOffsetSeconds: number; // 5 seconds in YouTube
  rewardTokens?: number;
  adUnitId: string; // From Google AdMob / AdSense test units
}

export const SAMPLE_VIDEO_ADS: VideoAdItem[] = [
  {
    id: 'ad_gcp_01',
    format: 'preroll',
    advertiserName: 'Google Cloud Platform',
    advertiserLogo: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=120&q=80',
    headline: 'Build Faster with Google Cloud Vertex AI & Cloud Run',
    tagline: 'Deploy auto-scaling containerized microservices in seconds with $300 free credits.',
    displayUrl: 'cloud.google.com/vertex-ai',
    ctaText: 'Claim $300 Credits',
    destinationUrl: 'https://cloud.google.com',
    videoUrl: '/videos/sample.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 15,
    skipOffsetSeconds: 5,
    rewardTokens: 2,
    adUnitId: 'ca-app-pub-3940256099942544/1033173712',
  },
  {
    id: 'ad_cursor_02',
    format: 'preroll',
    advertiserName: 'Cursor AI Editor',
    advertiserLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    headline: 'The AI-First Code Editor Built for Engineers',
    tagline: 'Index your whole codebase and rewrite multi-file architectures in natural language.',
    displayUrl: 'cursor.com/download',
    ctaText: 'Download for Free',
    destinationUrl: 'https://cursor.com',
    videoUrl: '/videos/sample.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 15,
    skipOffsetSeconds: 5,
    rewardTokens: 2,
    adUnitId: 'ca-app-pub-3940256099942544/5224354917',
  },
  {
    id: 'ad_linear_03',
    format: 'shorts_sponsored',
    advertiserName: 'Linear Systems',
    advertiserLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    headline: 'Purpose-built tool for modern software teams',
    tagline: 'Streamline issues, projects, and product roadmaps with sub-50ms latency.',
    displayUrl: 'linear.app/modern-teams',
    ctaText: 'Start Free Trial',
    destinationUrl: 'https://linear.app',
    videoUrl: '/videos/sample.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    durationSeconds: 12,
    skipOffsetSeconds: 5,
    rewardTokens: 2,
    adUnitId: 'ca-app-pub-3940256099942544/1044960115',
  },
  {
    id: 'ad_supabase_04',
    format: 'feed_native',
    advertiserName: 'Supabase Postgres',
    advertiserLogo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=120&q=80',
    headline: 'Build in a weekend. Scale to millions with Postgres.',
    tagline: 'Instant REST and GraphQL APIs, real-time subscriptions, and vector embeddings.',
    displayUrl: 'supabase.com/database',
    ctaText: 'Launch Project',
    destinationUrl: 'https://supabase.com',
    videoUrl: '/videos/sample.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 15,
    skipOffsetSeconds: 5,
    rewardTokens: 2,
    adUnitId: 'ca-app-pub-3940256099942544/2247696110',
  },
  {
    id: 'ad_aws_05',
    format: 'rewarded',
    advertiserName: 'AWS Cloud Architecture',
    advertiserLogo: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=120&q=80',
    headline: 'Serverless Event-Driven Architectures at Scale',
    tagline: 'Watch complete sponsored builder breakdown to claim +2 RUP tokens.',
    displayUrl: 'aws.amazon.com/serverless',
    ctaText: 'Claim +2 Tokens',
    destinationUrl: 'https://aws.amazon.com',
    videoUrl: '/videos/sample.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 15,
    skipOffsetSeconds: 5,
    rewardTokens: 2,
    adUnitId: 'ca-app-pub-3940256099942544/5224354917',
  },
];
