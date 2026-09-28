export interface Role {
  title: string;
  dates: string;
}

export interface Job {
  company: string;
  location: string;
  roles: Role[];
  bullets: string[];
}

export const experience: Job[] = [
  {
    company: 'IDX Exchange',
    location: 'Remote, US',
    roles: [{ title: 'NLP Engineer Intern', dates: 'Sep 2026 – Present' }],
    bullets: [
      'Built semantic search over 10,000+ listings with sentence-transformer embeddings and FAISS, evaluated against BM25 and served by an 8-endpoint FastAPI service at sub-100ms latency.',
      'Built an entity extractor and a natural-language query parser with parameterized SQL generation, reaching 87% extraction F1 and 92% query-parsing accuracy.',
    ],
  },
  {
    company: 'San José State University',
    location: 'San Jose, CA',
    roles: [
      {
        title: 'Instructional Student Assistant — Deep Learning (DATA 255) & Generative AI (DATA 266)',
        dates: 'Jul 2026 – Present',
      },
    ],
    bullets: [
      'Developed curriculum and mentored 100+ graduate students on model deployment and distributed training.',
      'Automated grading pipelines and submission-management scripts for high-enrollment courses.',
    ],
  },
  {
    company: 'HexasenseAI',
    location: 'Austin, TX (Remote)',
    roles: [{ title: 'ML Engineer Intern', dates: 'Jun 2025 – Aug 2025' }],
    bullets: [
      'Deployed optimized ML pipelines that cut inference latency by 30%.',
      'Built clinical risk-prediction models on healthcare data, applying Responsible AI practices across the ML lifecycle.',
    ],
  },
  {
    company: 'Larsen & Toubro Infotech (LTI)',
    location: 'India',
    roles: [
      { title: 'System Consultant (Data & Analytics Engineer)', dates: 'Jan 2020 – May 2021' },
      { title: 'Software Engineer', dates: 'Sep 2017 – Dec 2019' },
    ],
    bullets: [
      'Built Python/SQL/Airflow ETL pipelines handling 1M+ records/day and integrated 5+ sources into a Snowflake warehouse.',
      'Built Python backend services handling 50K+ transactions/day and shipped 10+ production features via REST APIs.',
    ],
  },
];
