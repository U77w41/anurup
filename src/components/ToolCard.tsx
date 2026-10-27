import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BADGE_CLASS, BADGE_HINT, toolHref, type ToolDef } from "@/lib/tools";
import { Tip } from "@/components/Tip";

/** Card in the style of the portfolio's article list: pastel tag, bold title, muted summary. */
const ToolCard = ({ tool, index = 0 }: { tool: ToolDef; index?: number }) => {
  const Icon = tool.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.03, duration: 0.25 }}>
      <Link to={toolHref(tool.id)} className="group flex h-full flex-col rounded-lg bg-card p-6 shadow-card card-hover">
        <div className="mb-4 flex items-center justify-between">
          <Tip label={BADGE_HINT[tool.badge]}>
            <span className={`rounded px-2.5 py-1 text-sm ${BADGE_CLASS[tool.badge]}`}>{tool.badge}</span>
          </Tip>
          <Tip label={`Open ${tool.title}`}>
            <span>
              <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" strokeWidth={1.5} />
            </span>
          </Tip>
        </div>
        <h3 className="text-lg font-bold text-card-foreground">{tool.title}</h3>
        <p className="mt-2 leading-relaxed text-muted-foreground">{tool.description}</p>
      </Link>
    </motion.div>
  );
};

export default ToolCard;
