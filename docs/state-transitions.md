# State transitions

```text
Job:        draft -> open -> (paused <-> open) -> in_discussion -> agreed -> completed
                         \-> closed / expired / removed (moderation)
Response:   sent -> viewed -> shortlisted -> introduced | declined | withdrawn
Booking:    requested -> accepted | declined | proposed_new_time -> confirmed -> attended | no_show | cancelled
Completion: marked_by_one_party -> confirmed_by_both -> review_window_open -> closed
Review:     submitted -> published | held_for_moderation -> published | removed
Subscription: none -> trialing -> active -> past_due -> cancelled
```
