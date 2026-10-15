const layers = require('./dependency-cruiser.cjs');

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    ...layers.options,
    // Analyze the runtime graph itself: filtering a reported mixed cycle can
    // conceal a longer runtime cycle when the analyzer retains only one path.
    tsPreCompilationDeps: false,
  },
};
