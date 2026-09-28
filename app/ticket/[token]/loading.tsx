export default function TicketLoading() {
  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <div className="lilac-skeleton h-6 w-32 rounded-card bg-canvas-raised" />
      <div className="mt-6 lilac-skeleton aspect-square w-full rounded-card bg-canvas-raised" />
      <div className="mt-6 lilac-skeleton h-4 w-2/3 rounded-card bg-canvas-raised" />
    </div>
  );
}
