import {
  Code,
  Zap,
  Layers,
  Database,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export default function PromptStarters({ onSelectPrompt, userName }) {
  const starters = [
    {
      icon: <Code size={20} className="starter-icon-violet" />,
      title: "Express Controller Pattern",
      desc: "Explain how wrapAsync & Zod schemas protect API endpoints.",
      prompt: "Explain how wrapAsync middleware and Zod schemas work together to handle errors and validate payloads in Express.js",
    },
    {
      icon: <Database size={20} className="starter-icon-emerald" />,
      title: "Prisma & Postgres Optimization",
      desc: "How does cursor-based pagination differ from limit/offset?",
      prompt: "Compare cursor-based pagination versus page/offset pagination in Postgres with Prisma ORM. Show examples for both.",
    },
    {
      icon: <Layers size={20} className="starter-icon-pink" />,
      title: "Clean Architecture Setup",
      desc: "Design a decoupled service layer pattern in Node.js.",
      prompt: "Show me a clean architecture folder structure for a production-grade Node.js backend using controllers, services, and models.",
    },
    {
      icon: <Zap size={20} className="starter-icon-amber" />,
      title: "OpenAI Streaming API",
      desc: "How to connect OpenAI API SDK stream to Express?",
      prompt: "Write an Express.js controller snippet that connects the official OpenAI API SDK (gpt-4o) and streams chunks to the client.",
    },
  ];

  return (
    <div className="prompt-starters-wrapper">
      <div className="starters-hero">
        <div className="hero-glowing-badge">
          <Sparkles size={14} /> Powered by Atlas & OpenAI Models
        </div>
        <h1 className="starters-title">
          Where shall we begin, <span className="highlight-text">{userName || "Explorer"}</span>?
        </h1>
        <p className="starters-subtitle">
          Select a prompt starter below or type your query to initiate a secure conversation saved in PostgreSQL.
        </p>
      </div>

      <div className="starters-grid">
        {starters.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="starter-card"
          >
            <div className="card-top">
              <div className="icon-wrapper">{item.icon}</div>
              <ArrowUpRight size={16} className="arrow-icon" />
            </div>
            <h3 className="card-title">{item.title}</h3>
            <p className="card-desc">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
