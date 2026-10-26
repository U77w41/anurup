import type { ToolContent } from "@/seo/content";

/** "How to" steps and FAQ shown under every tool (the same text is prerendered for search engines). */
const ToolGuide = ({ content }: { content: ToolContent }) => (
  <section className="rounded-lg bg-card p-6 shadow-card sm:p-8" aria-labelledby="how-to">
    <h2 id="how-to" className="text-xl font-bold text-card-foreground">
      {content.howTo}
    </h2>
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground marker:font-bold marker:text-primary">
      {content.steps.map((s) => (
        <li key={s} className="pl-1 leading-relaxed">
          {s}
        </li>
      ))}
    </ol>
    {content.faq.length > 0 && (
      <>
        <h2 className="mt-8 text-xl font-bold text-card-foreground">Questions</h2>
        <dl className="mt-4 space-y-4">
          {content.faq.map((f) => (
            <div key={f.q}>
              <dt className="font-bold text-card-foreground">{f.q}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </>
    )}
  </section>
);

export default ToolGuide;
