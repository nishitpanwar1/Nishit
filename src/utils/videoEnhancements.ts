import { VideoItem, VideoChapter, TranscriptLine } from '../types';

/**
 * Formats seconds into mm:ss or hh:mm:ss string
 */
export const formatTimestamp = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

/**
 * Parse timestamp strings like "01:23" or "1:02:45" to seconds
 */
export const parseTimestamp = (str: string): number | null => {
  const parts = str.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
};

/**
 * Extract chapters from description or synthesize domain-specific milestones
 */
export const getVideoChapters = (video: VideoItem): VideoChapter[] => {
  if (video.chapters && video.chapters.length > 0) {
    return video.chapters;
  }

  // Attempt to parse timestamp patterns from description (e.g. "0:00 Intro", "01:30 Architecture")
  if (video.description) {
    const lines = video.description.split('\n');
    const parsed: VideoChapter[] = [];
    const timestampRegex = /(?:^|\s)(\d{1,2}:\d{2}(?::\d{2})?)\s+(?:[-–—]\s*)?(.+)/i;

    lines.forEach((line, idx) => {
      const match = line.match(timestampRegex);
      if (match) {
        const timeSec = parseTimestamp(match[1]);
        if (timeSec !== null) {
          parsed.push({
            id: `chap_${video.id}_${idx}`,
            startTime: timeSec,
            title: match[2].trim(),
          });
        }
      }
    });

    if (parsed.length >= 2) {
      // Sort and calculate end times
      parsed.sort((a, b) => a.startTime - b.startTime);
      for (let i = 0; i < parsed.length; i++) {
        parsed[i].endTime = i < parsed.length - 1 ? parsed[i + 1].startTime : video.durationSeconds;
      }
      return parsed;
    }
  }

  // Synthesize intelligent structured chapters based on video duration and category
  const total = video.durationSeconds || 180;
  const t0 = 0;
  const t1 = Math.round(total * 0.18);
  const t2 = Math.round(total * 0.45);
  const t3 = Math.round(total * 0.75);
  const t4 = Math.round(total * 0.92);

  const categoryPresets: Record<string, string[]> = {
    Engineering: [
      'Problem Statement & Constraints',
      'System Architecture & Data Flow',
      'Hands-on Implementation',
      'Load Testing & Latency Profile',
      'Key Takeaways & Deploy Checklist',
    ],
    Systems: [
      'Operational Overview & SLOs',
      'High-Availability Architecture',
      'Failure Modes & Chaos Validation',
      'Distributed Tracing & Spans',
      'Production Readiness Assessment',
    ],
    Focus: [
      'Focus Protocol & Brain State Prep',
      'Eliminating Cognitive Switching',
      'Deep Work Sprint Execution',
      'Dopamine Reset & Recovery',
      'Action Plan for Tomorrow',
    ],
    Fitness: [
      'Physiological Mechanics & Form',
      'Warm-up & Activation Phase',
      'Main Progressive Resistance Set',
      'Cardiorespiratory Conditioning',
      'Recovery & Nutrient Timing',
    ],
    Finance: [
      'Macro Context & Cash Flow Rules',
      'Capital Allocation Strategy',
      'Risk Management & Hedging',
      'Compounding Mathematical Models',
      'Portfolio Rebalancing Action Items',
    ],
    Mindset: [
      'Mental Model & Psychological Premise',
      'Deconstructing Cognitive Biases',
      'Practical Case Study & Real Scenarios',
      'Daily Mental Conditioning Ritual',
      'Core Principles Summary',
    ],
  };

  const titles = categoryPresets[video.category] || categoryPresets.Engineering;

  return [
    { id: `ch_1_${video.id}`, startTime: t0, endTime: t1, title: titles[0] },
    { id: `ch_2_${video.id}`, startTime: t1, endTime: t2, title: titles[1] },
    { id: `ch_3_${video.id}`, startTime: t2, endTime: t3, title: titles[2] },
    { id: `ch_4_${video.id}`, startTime: t3, endTime: t4, title: titles[3] },
    { id: `ch_5_${video.id}`, startTime: t4, endTime: total, title: titles[4] },
  ];
};

/**
 * Generate or retrieve synchronized interactive transcript
 */
export const getVideoTranscript = (video: VideoItem): TranscriptLine[] => {
  if (video.transcript && video.transcript.length > 0) {
    return video.transcript;
  }

  const dur = video.durationSeconds || 180;
  const title = video.title || 'Technical Session';
  const category = video.category || 'Engineering';

  // Construct contextual phrases matching duration
  const timestamps = [
    0,
    Math.round(dur * 0.08),
    Math.round(dur * 0.16),
    Math.round(dur * 0.26),
    Math.round(dur * 0.38),
    Math.round(dur * 0.50),
    Math.round(dur * 0.62),
    Math.round(dur * 0.74),
    Math.round(dur * 0.85),
    Math.round(dur * 0.94),
  ];

  const phrases = [
    `Welcome everyone to this session on "${title}".`,
    `Let's immediately look at the foundational architecture requirements and design goals.`,
    `Notice how decoupling the primary pipeline avoids blocking operations during peak traffic.`,
    `Here in the core configuration, we enforce strict idempotency and structured logging.`,
    `When benchmarking this in our staging cluster, p99 latency dropped by over forty percent.`,
    `Let's step through the implementation details line by line to verify data integrity.`,
    `Notice how failure recovery gracefully handles connection timeouts and backpressure.`,
    `This provides zero regression on our mission-critical data pathways.`,
    `In summary, keep your interfaces cohesive and always profile real workloads.`,
    `Thanks for watching. Remember to lock in your discipline sprint in the accountability room.`,
  ];

  return timestamps.map((time, idx) => ({
    id: `tr_${video.id}_${idx}`,
    startTime: time,
    text: phrases[idx] || `Analyzing ${category} execution parameters at step ${idx + 1}.`,
  }));
};
