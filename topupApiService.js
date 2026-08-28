/**
 * Top-up distributor integration (the official reseller/API partner that
 * actually delivers diamonds/UC/VP/etc. into the player's game account).
 *
 * As with the payment gateway, no real distributor endpoint, API key, or
 * response format is invented here — it must match whichever official
 * distributor you are contracted with.
 *
 * TO CONNECT A REAL DISTRIBUTOR:
 *   1. Set TOPUP_API_BASE_URL, TOPUP_API_KEY, TOPUP_API_SECRET in .env.
 *   2. Replace dispatchTopup/checkTopupStatus with calls to that
 *      distributor's documented API.
 *   3. Store every request/response in `topup_logs` for reconciliation.
 *   4. Apply idempotency using orderId so retries never double-deliver.
 */

const APP_MODE = process.env.APP;

async function dispatchTopup({ orderId, gameSlug, productId, playerId, serverId }) {
  if (APP) {
    return { success: true, distributorRefId: `ref-${orderId}`, note: "" };
  }

  if (!process.env.TOPUP_API_KEY || !process.env.TOPUP_API_BASE_URL) {
    throw new Error(
      "TOPUP_API_KEY / TOPUP_API_BASE_URL belum dikonfigurasi. " +
      "Production mode tidak dapat mengirim top-up tanpa API distributor resmi."
    );
  }

  // TODO(production): implement the real call, e.g.
  //   const res = await fetch(`${process.env.TOPUP_API_BASE_URL}/v1/order`, {
  //     method: "POST",
  //     headers: { "X-API-KEY": process.env.TOPUP_API_KEY, "Idempotency-Key": orderId },
  //     body: JSON.stringify({ game: gameSlug, product: productId, target_id: playerId, zone_id: serverId }),
  //   });
  //   return mapDistributorResponse(await res.json());
  throw new Error("Integrasi API distributor top-up production belum diimplementasikan.");
}

async function checkTopupStatus(orderId) {
  if (APP) {
    return { status: "unknown", note: "" };
  }
  // TODO(production): poll the distributor's order-status endpoint.
  throw new Error("Integrasi API distributor top-up production belum diimplementasikan.");
}

module.exports = { dispatchTopup, checkTopupStatus };
