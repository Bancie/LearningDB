/** Deep link into Data browser filtered to one ACTIVITY row (PK ACTIVITY_ID). */
export function dataBrowserActivityHref(activityId: number): string {
  const params = new URLSearchParams({
    table: 'ACTIVITY',
    filters: JSON.stringify({ ACTIVITY_ID: activityId }),
  });
  return `/data-browser?${params.toString()}`;
}
