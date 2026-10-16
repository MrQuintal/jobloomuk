# Proposed business-rule defaults (editable later in admin)

| Setting | Default | Why |
|---|---|---|
| newcomer_boost_days | 90 | New workers get fair exposure while building reputation |
| review_min_days_after_completion | 1 | Prevents instant/spam reviews |
| Review eligibility | Only after both parties confirm the job happened via a Jobloom introduction | Credible reviews |
| Ranking | Relevance + distance + evidence quality + response rate; subscription tier never affects review scores | Fairness |
| Price guidance minimum sample | 10 completed jobs per category/area | Avoid misleading figures |

## Category-specific pricing tips
`platform_settings.category_pricing_tips` holds arrays of qualitative tips keyed by category slug, with `general` as the fallback. Admins can edit the tips under Overview & settings. Signed-in customers can read only this setting through a narrowly scoped policy; other settings remain admin-only. Tips do not contain invented monetary ranges or claim to be historical evidence.
