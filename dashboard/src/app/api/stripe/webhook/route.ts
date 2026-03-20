import { NextRequest, NextResponse } from "next/server";
import { constructEvent } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  try {
    const event = constructEvent(body, sig);

    switch (event.type) {
      case "checkout.session.completed":
        console.log("Checkout completed:", event.data.object);
        break;
      case "customer.subscription.deleted":
        console.log("Subscription cancelled:", event.data.object);
        break;
      case "invoice.payment_failed":
        console.log("Payment failed:", event.data.object);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
