/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-layer-violations',
      severity: 'error',
      comment: 'UI and data layers must not be imported from core/shared modules.',
      from: {
        path: '^src/(domain|types|lib|platform|i18n|assets)',
      },
      to: {
        path: '^src/(components|pages|hooks|contexts|repositories|services|use-cases)',
      },
    },
    {
      name: 'no-ui-from-data',
      severity: 'error',
      comment: 'Data layer should not depend on UI modules.',
      from: {
        path: '^src/(repositories|services|use-cases)',
      },
      to: {
        path: '^src/(components|pages|hooks|contexts)',
      },
    },
    {
      name: 'no-app-from-testing',
      severity: 'error',
      comment: 'Production code must not import from testing helpers.',
      from: {
        path: '^src/(?!testing)',
        pathNot: ['__tests__'],
      },
      to: {
        path: '^src/testing',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '^node_modules',
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    preserveSymlinks: false,
  },
};
