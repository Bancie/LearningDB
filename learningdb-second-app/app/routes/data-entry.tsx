import type { Route } from "./+types/data-entry";
import { Alert } from "~/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { stitchDesignReadmePath, stitchTokens } from "~/design-tokens";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Data entry — LearningDB" },
    { name: "description", content: "Experimental data entry UI (Stitch-ready)" },
  ];
}

export default function DataEntryRoute() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-label-md text-[var(--color-on-surface-variant)]">Console / Activities</p>
        <h1 className="text-headline-sm">Data entry</h1>
      </div>

      <Alert variant="info">
        UI này đang dùng token từ <code>{stitchDesignReadmePath}</code>. Primary color hiện tại:{" "}
        <code>{stitchTokens.color.primary}</code>.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Stitch-driven layout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-[var(--color-on-surface-variant)]">
            Form fields và bố cục đã sẵn sàng theo design system mới. Bạn có thể tiếp tục dùng trang này làm điểm vào
            cho workflow nhập liệu bổ sung sau import wizard.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
