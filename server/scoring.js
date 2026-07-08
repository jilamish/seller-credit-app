export function computeScores(seller) {
  const gmvScore = Math.min(seller.gmv_monthly / 10000, 40);
  const orderScore = Math.min(seller.order_count / 50, 20);
  const returnScore = Math.max(0, 20 - seller.return_rate * 100);
  const ageScore = Math.min((seller.account_age_months / 36) * 15, 15);
  const catalogScore = Math.min((seller.catalog_size / 500) * 5, 5);

  const alt_data_score =
    Math.round((gmvScore + orderScore + returnScore + ageScore + catalogScore) * 10) / 10;

  const bureauRaw =
    300 +
    Math.min(seller.account_age_months / 60, 1) * 300 +
    Math.min(seller.gmv_monthly / 50000, 1) * 200 +
    Math.min(seller.order_count / 500, 1) * 100;

  const bureau_score_sim = Math.round(Math.min(bureauRaw, 900));

  return { alt_data_score, bureau_score_sim };
}
