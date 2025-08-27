export default function LoadingPage() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground mb-2">SATYASRI COMPUTERS</h2>
        <p className="text-muted-foreground">Loading Service Center...</p>
      </div>
    </div>
  );
}
