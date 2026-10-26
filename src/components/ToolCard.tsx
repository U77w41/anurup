import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BADGE_CLASS, toolHref, type ToolDef } from "@/lib/tools";

const ToolCard = ({ tool, index = 0 }: { tool: ToolDef; index?: number }) => {
  const Icon = tool.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}>
      <Link to={toolHref(tool.id)} className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-card card-hover">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_CLASS[tool.badge]}`}>{tool.badge}</span>
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground transition-colors group-hover:text-primary">{tool.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      </Link>
    </motion.div>
  );
};

export default ToolCard;
