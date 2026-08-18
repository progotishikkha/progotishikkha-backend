import { Types } from "mongoose";
import { TutorProfile, ITutorProfile } from "../models/tutorProfile.model";
import { Notification } from "../models/notification.model";
import { ITuitionPost } from "../models/tuitionPost.model";
import { notify } from "./notification.service";

/**
 * Automated tutor <-> tuition-post matching.
 *
 * Runs once, right after a student publishes a tuition post. It scores every
 * *approved* tutor against the post on four factors and notifies anyone who
 * clears a minimum relevance bar, best matches first. It never re-notifies
 * the same tutor for the same post (checked against the Notification
 * collection, not an in-memory set, so it's safe even across server
 * restarts or multiple app instances).
 */

const WEIGHTS = {
  subject: 40,
  location: 30,
  teachingMode: 15,
  availability: 15,
} as const;

/** A match needs to clear this score to be worth a notification at all. */
const MIN_MATCH_SCORE = 40;

/** Cap how many tutors get notified per post so this can't spam everyone. */
const MAX_MATCHES_NOTIFIED = 25;

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

/**
 * Tutor profiles don't have a `teachingMode` field the way tuition posts do
 * — a tutor's `availability` (weekdays/weekends/evenings/flexible) is the
 * closest analogue to "can this tutor realistically take this on", so it
 * doubles as a soft proxy for the post's teachingMode/schedule fit. This
 * keeps the scoring meaningful without requiring a schema migration.
 */
const scoreTutorForPost = (tutor: ITutorProfile, post: ITuitionPost): number => {
  let score = 0;

  const subjectMatch = tutor.subjects.some((s) => normalize(s) === normalize(post.subject));
  const subjectPartialMatch =
    !subjectMatch && tutor.subjects.some((s) => normalize(post.subject).includes(normalize(s)) || normalize(s).includes(normalize(post.subject)));
  if (subjectMatch) score += WEIGHTS.subject;
  else if (subjectPartialMatch) score += WEIGHTS.subject * 0.5;

  const tutorLocation = normalize(tutor.location);
  const postLocation = normalize(post.location);
  if (tutorLocation && postLocation) {
    if (tutorLocation === postLocation) score += WEIGHTS.location;
    else if (tutorLocation.includes(postLocation) || postLocation.includes(tutorLocation)) {
      score += WEIGHTS.location * 0.6;
    }
  }

  // Online tuition removes the location constraint almost entirely — a
  // remote-friendly tutor anywhere is still a strong match.
  if (post.teachingMode === "online") score += WEIGHTS.teachingMode;
  else if (post.teachingMode === "both") score += WEIGHTS.teachingMode * 0.6;

  if (tutor.availability === "flexible") score += WEIGHTS.availability;
  else if (tutor.availability) score += WEIGHTS.availability * 0.4;

  return Math.round(score);
};

export const matchTutorsForPost = async (post: ITuitionPost): Promise<number> => {
  const candidates = await TutorProfile.find({
    isApproved: true,
    subjects: { $exists: true, $not: { $size: 0 } },
  }).select("user subjects location availability");

  const scored = candidates
    .map((tutor) => ({ tutor, score: scoreTutorForPost(tutor, post) }))
    .filter((m) => m.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES_NOTIFIED);

  if (scored.length === 0) return 0;

  // Skip anyone already notified about this exact post (idempotent — safe
  // to call matchTutorsForPost more than once for the same post, e.g. a
  // retry after a transient error).
  const alreadyNotified = await Notification.find({
    type: "new_match",
    relatedId: post._id,
    recipient: { $in: scored.map((m) => m.tutor.user) },
  }).distinct("recipient");
  const alreadyNotifiedSet = new Set(alreadyNotified.map((id: Types.ObjectId) => id.toString()));

  const toNotify = scored.filter((m) => !alreadyNotifiedSet.has(m.tutor.user.toString()));

  await Promise.all(
    toNotify.map((m) =>
      notify({
        recipient: m.tutor.user,
        type: "new_match",
        message: `New tuition matching your profile: ${post.title} (${post.subject}, ${post.location})`,
        link: `/tutor/browse/${post._id}`,
        relatedId: post._id,
      })
    )
  );

  return toNotify.length;
};
