export interface StepItem {
  number: string;
  title: string;
  description: string;
}

export const howItWorksSteps: StepItem[] = [
  {
    number: "01",
    title: "Feed AETHER your writing",
    description: "Provide essays, threads, emails, notes, or transcripts. AETHER digests the raw material of how you naturally organize thoughts and project authority."
  },
  {
    number: "02",
    title: "Build your Voice Model",
    description: "AETHER maps your signature linguistic fingerprint—dissecting sentence rhythms, vocabulary density, syntactic patterns, and punctuation weights."
  },
  {
    number: "03",
    title: "Create your Identity Profile",
    description: "Translate your specific style into a secure, persistent digital asset. Your personal voice model is stored forever, acting as your direct creative proxy."
  },
  {
    number: "04",
    title: "Generate at Scale",
    description: "Instantly draft posts, newsletters, threads, emails, or landing pages. Everything reads with your exact human inflection, stripping away creative bottlenecks."
  }
];

export interface TrioCardItem {
  num: string;
  title: string;
  description: string;
  example: string;
}

export const trioCards: TrioCardItem[] = [
  {
    num: "01 — Archetype",
    title: "Voice Archetype",
    description: "Your writing personality distilled into a precise name. Not a category — a character. The moment people screenshot and share.",
    example: "You don't ask for attention. <strong>You own it.</strong>"
  },
  {
    num: "02 — Identity",
    title: "Voice Number",
    description: "Your unique place in AETHER. A signal that you got here early. Low numbers carry weight in the right communities.",
    example: "Voice <strong>#247</strong> · Activated · Early access"
  },
  {
    num: "03 — Score",
    title: "Authenticity Score",
    description: "Every output is measured against your voice patterns in real time. You always know exactly how close AETHER got.",
    example: "Last creation: <strong>98% ✦</strong> — perfect match"
  }
];

export interface MetricItem {
  label: string;
  value: number;
}

export const radarMetrics: MetricItem[] = [
  { label: "Tone", value: 88 },
  { label: "Rhythm", value: 72 },
  { label: "Vocabulary", value: 94 },
  { label: "Edge", value: 81 },
  { label: "Consistency", value: 76 }
];

export interface PricingPlan {
  name: string;
  description: string;
  isPopular?: boolean;
  priceMonthly: string;
  priceAnnual: string;
  annualSub: string;
  scoreText: string;
  scoreActiveCount: number; // For rendering active segments (0-10)
  scoreMaxIndex?: number; // Index indicating 'max' highlight (e.g. 9 for Pro, 0 for Enterprise)
  features: string[];
  ctaLabel: string;
  ctaType: "outline" | "fill" | "ghost";
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    description: "Explore AETHER.",
    priceMonthly: "$0",
    priceAnnual: "$0",
    annualSub: "forever",
    scoreText: "15 voice-matched creations / month",
    scoreActiveCount: 5,
    features: [
      "15 creations per month",
      "1 Voice Profile",
      "3 content types",
      "7-day history",
      "Basic voice analysis"
    ],
    ctaLabel: "Get early access",
    ctaType: "outline"
  },
  {
    name: "Pro",
    description: "Your voice. Unlimited.",
    priceMonthly: "$29",
    priceAnnual: "$276",
    annualSub: "save $72",
    scoreText: "Unlimited creations · Personalized Voice Engine",
    scoreActiveCount: 10,
    scoreMaxIndex: 9, // last segment is max
    features: [
      "Unlimited creations",
      "3 Voice Profiles",
      "Personalized Voice Engine",
      "All content types",
      "Unlimited history",
      "Authenticity score",
      "Priority support",
      "Early access to new features"
    ],
    ctaLabel: "Get early access",
    ctaType: "fill"
  }
];

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export const faqList: FAQItem[] = [
  {
    id: 1,
    question: "How does AETHER learn my voice?",
    answer: "You paste examples of your writing — tweets, posts, articles, anything. AETHER analyzes your patterns across five dimensions and builds a Voice Identity that's uniquely yours."
  },
  {
    id: 2,
    question: "Will it actually sound like me?",
    answer: "That's the whole point. The more writing you feed it, the sharper the result. You also pick which sample sounds most like you during setup — so AETHER calibrates to your exact voice. The Authenticity Score tells you how close every voice-matched creation is."
  },
  {
    id: 3,
    question: "What is the Authenticity Score?",
    answer: "A real-time signal of how closely a voice-matched creation aligns with your detected voice patterns. Not a made-up percentage — an actual count of how many of your patterns appear in each piece AETHER writes for you."
  },
  {
    id: 4,
    question: "What formats does AETHER support?",
    answer: "Tweets, threads, LinkedIn posts, newsletters, announcements, product launches, fundraise posts, and free-form content. Every format, every platform."
  },
  {
    id: 5,
    question: "Can I retrain my Voice Profile?",
    answer: "Yes. Your voice evolves and AETHER keeps up. Retrain anytime by pasting new writing samples. Your archetype may shift. Your score will recalibrate."
  },
  {
    id: 6,
    question: "What payment methods do you accept?",
    answer: "PayPal and crypto. Simple, no hidden fees, cancel anytime."
  }
];

export interface HeroVariant {
  id: string;
  name: string;
  line1: string;
  line2: string;
  subheadline: string;
  pillText: string;
}

export const heroVariants: HeroVariant[] = [
  {
    id: "identity",
    name: "Full Identity",
    line1: "AI that writes",
    line2: "exactly like you.",
    subheadline: "Turn your past writing into a personal content engine.",
    pillText: "Authenticity Match"
  },
  {
    id: "scale",
    name: "Scale",
    line1: "Write once.",
    line2: "Scale infinitely.",
    subheadline: "Transform your best original thoughts into an automated multi-channel ecosystem.",
    pillText: "Zero-Latency Proxy"
  },
  {
    id: "signature",
    name: "Signature",
    line1: "Your digital",
    line2: "style is an asset.",
    subheadline: "Claim your authentic voice signature and guarantee content matches your exact style.",
    pillText: "Cryptographic Fingerprint"
  },
  {
    id: "leverage",
    name: "Leverage",
    line1: "Bypass the",
    line2: "blank page forever.",
    subheadline: "Feed AETHER your fragmented sentences—generate fully fleshed articles automatically.",
    pillText: "Speed & Amplification"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    line1: "Align voice",
    line2: "across your team.",
    subheadline: "Empower your organization to draft emails, reports, and socials in your authentic voice.",
    pillText: "Brand Guardrails"
  }
];

