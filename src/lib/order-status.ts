import { SDK as FusionX, OrderStatus } from "@1inch/cross-chain-sdk";

export async function checkOrderStatus(orderHash: string) {
  const client = new FusionX({
    // same base URL you used before
    url: "http://localhost:3001/api/1inch",
    // blockchainProvider is NOT required just to read status
  });

  const res = await client.getOrderStatus(orderHash);
  // res includes { status, fills?, ... }
  console.log("status:", res.status, res);

  switch (res.status) {
    case OrderStatus.Executed:
      console.log("✅ Order executed"); break;
    case OrderStatus.Expired:
      console.log("⌛️ Order expired"); break;
    case OrderStatus.Refunded:
      console.log("↩️ Order refunded"); break;
    default:
      console.log("⏳ Still in progress");
  }

  return res;
}