/* ============================================================
   Prajna Co-hab — site config
   ------------------------------------------------------------
   LIVE DATA. Rent and deposit figures were supplied by the owner
   on 2026-10-02. The dinner prices were reconciled on 2026-11-05:
   rooms.html had been shipping an older pair (8,500 / 10,500) that
   disagreed with every other page and with the JSON-LD offers.

   ONE PRICE BOOK. Every rupee the site shows is derived from the
   four numbers below, and nothing else is allowed to hard-code a
   price. Change twinRentMeal here and the homepage, the cost card,
   the schema and the price test all follow. Static HTML carries the
   same figures as no-JS fallbacks; `npm run check:prices` fails the
   build if the two ever disagree.

   CONTACT MODEL: the owner's number is NEVER published. Visitors
   email; the number is handed over in the reply if they want to
   talk. `phone` stays blank permanently - that is deliberate.
   ============================================================ */
window.PRAJNA = {

  /* ---- CONTACT -------------------------------------------------
     The owner's real address, supplied 2026-10-02. This is the ONLY
     public contact point on the site.
     ------------------------------------------------------------ */
  email: "srijna2b@gmail.com",
  phone: "",                // NEVER publish this.

  /* ---- RENT ----------------------------------------------------
     Two plans per room type. "With dinner" means DINNER ONLY -
     breakfast and lunch are not included at either price, and the
     site says so plainly rather than letting people find out later.
     ---------------------------------------------------------- */
  twinRent: 7200,           // double sharing, room only
  twinRentMeal: 10000,      // double sharing, dinner included
  singleRent: 9200,         // private room, room only
  singleRentMeal: 12000,    // private room, dinner included

  twinDeposit: 12000,
  singleDeposit: 14000,

  /* ---- AVAILABILITY: nothing free as of 2026-11-05 ---- */
  bedsOpen: 0,
  availability: "No beds free right now — tell us when you’re looking and we’ll put you first when one opens",

  /* ---- TERMS ---- */
  lockInMonths: 3,
  noticeMonths: 1,

  /* ---- FORM BACKEND ----
     Google Apps Script /exec URL. See LEAD-CAPTURE-SETUP.md.
     Empty = the forms hand the visitor a pre-filled email instead,
     so the site still works with no backend at all. Set it once the
     script is deployed; every form then posts to the sheet. */
  endpoint: "",

  community: "",
  ownerNote: "Owner-run. Owner-managed. No broker."
};

/* ---- DERIVED FIGURES -----------------------------------------
   Computed, never typed. If a number below is wrong, one of the
   four rents above is wrong - there is no other place to look.
   -------------------------------------------------------------- */
(function(C){
  function num(v){ return typeof v === "number" && isFinite(v) && v > 0; }

  if (num(C.twinRent) && num(C.twinRentMeal)) C.twinMealDelta = C.twinRentMeal - C.twinRent;
  if (num(C.singleRent) && num(C.singleRentMeal)) C.singleMealDelta = C.singleRentMeal - C.singleRent;

  if (num(C.twinRent) && num(C.twinDeposit)) C.costTwin = C.twinRent + C.twinDeposit;
  if (num(C.twinRentMeal) && num(C.twinDeposit)) C.costTwinMeal = C.twinRentMeal + C.twinDeposit;
  if (num(C.singleRent) && num(C.singleDeposit)) C.costSingle = C.singleRent + C.singleDeposit;
  if (num(C.singleRentMeal) && num(C.singleDeposit)) C.costSingleMeal = C.singleRentMeal + C.singleDeposit;

  /* The two dinner plans must cost the same add-on. If they ever
     diverge, the price book is broken and the test says so. */
  C.mealDeltaConsistent = C.twinMealDelta === C.singleMealDelta;

  /* Deposit expressed in months of rent, for the FAQ. */
  if (num(C.twinDeposit) && num(C.twinRent)) C.twinDepositMonths = Math.round((C.twinDeposit / C.twinRent) * 10) / 10;
  if (num(C.singleDeposit) && num(C.singleRent)) C.singleDepositMonths = Math.round((C.singleDeposit / C.singleRent) * 10) / 10;

  /* Cheapest honest headline, used by meta text and share copy. */
  if (num(C.twinRent)) C.fromRent = Math.min(C.twinRent, num(C.singleRent) ? C.singleRent : C.twinRent);
})(window.PRAJNA);
