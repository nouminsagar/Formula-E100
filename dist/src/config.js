(function () {
  "use strict";

  // The repository /api folder contains Cloudflare Worker source code.
  // The static game must call the deployed Worker service, not ./api.
  window.FormulaE100Config = Object.freeze({
    LEADERBOARD_API_BASE_URL: "https://formula-e100-leaderboard-api.formulae100.workers.dev",
  });
})();
