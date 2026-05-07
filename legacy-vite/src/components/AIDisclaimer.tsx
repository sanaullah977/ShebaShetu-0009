import { ShieldAlert } from "lucide-react";

export function AIDisclaimer() {
  return (
    <div className="glass border-warning/30 bg-warning/5 rounded-2xl p-4 flex gap-3 items-start">
      <div className="h-9 w-9 shrink-0 rounded-xl bg-warning/15 grid place-items-center">
        <ShieldAlert className="h-4.5 w-4.5 text-warning" />
      </div>
      <div className="text-xs leading-relaxed">
        <div className="font-semibold text-foreground mb-0.5">AI guidance is supportive only</div>
        <p className="text-muted-foreground">
          ShebaSetu's suggestions help you find the right department faster — they do
          <span className="text-foreground font-medium"> not replace doctor consultation</span>. Please
          consult a qualified physician for diagnosis and treatment.
        </p>
      </div>
    </div>
  );
}
