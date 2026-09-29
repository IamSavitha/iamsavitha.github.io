export interface SkillGroup {
  group: string;
  blurb: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    group: 'ML / DL',
    blurb: 'Training, evaluating and optimizing models',
    items: ['PyTorch', 'Scikit-Learn', 'CNNs', 'Transformers', 'ONNX', 'TensorFlow (coursework)'],
  },
  {
    group: 'AI / NLP / GenAI',
    blurb: 'LLMs, retrieval and language pipelines',
    items: ['LLMs', 'RAG', 'LoRA / QLoRA', 'LangChain', 'OpenAI API', 'FAISS', 'Vector databases', 'NLTK'],
  },
  {
    group: 'Deployment',
    blurb: 'Serving models on servers and edge hardware',
    items: ['FastAPI', 'Docker', 'MLflow', 'ONNX / NPU deployment', 'AWS S3', 'REST APIs'],
  },
  {
    group: 'Data engineering',
    blurb: 'Pipelines and warehouses at scale',
    items: ['PySpark', 'Kafka', 'Airflow', 'dbt', 'Snowflake', 'Data warehousing'],
  },
  {
    group: 'Languages & databases',
    blurb: 'Core languages and storage',
    items: ['Python', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
  },
  {
    group: 'Visualization',
    blurb: 'Dashboards and front ends',
    items: ['Tableau', 'Streamlit', 'React'],
  },
];
