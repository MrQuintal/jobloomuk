const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">Checkout isn't live yet — payments are being set up.</div>;
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-bloom/30 bg-bloom/10 px-4 py-2 text-center text-sm text-foreground">
        Payments in the preview are in test mode — use card 4242 4242 4242 4242.{" "}
        <a href="https://docs.lovable.dev/features/payments#test-and-live-environments" target="_blank" rel="noopener noreferrer" className="font-medium underline">Read more</a>
      </div>
    );
  }
  return null;
}
