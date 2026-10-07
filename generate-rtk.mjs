// RUNNING INSTRUCTIONS:
// node generate-rtk.mjs products

import fs from 'fs';
import path from 'path';

/**
 * Generate RTK Query API file
 * @param {string} moduleName - Name of the module (e.g., 'categories', 'products')
 */
function generateRTKFile(moduleName) {
  if (!moduleName) {
    console.error('❌ Error: Module name is required!');
    console.log('Usage: node generate-rtk.mjs <moduleName>');
    console.log('Example: node generate-rtk.mjs products');
    process.exit(1);
  }

  // Normalize module name
  const moduleNameLower = moduleName.toLowerCase();
  const moduleNameCamel = toCamelCase(moduleName);
  const moduleNamePascal = toPascalCase(moduleName);
  const moduleNameSingular = removePlural(moduleNameLower);
  const moduleNameSingularPascal = toPascalCase(moduleNameSingular);
  const fileName = toKebabCase(moduleName);
  const apiName = `${moduleNameCamel}Api`;

  // ✅ Create the JS RTK Query API file content
  const fileContent = `import { createApi } from '@reduxjs/toolkit/query/react';
import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const ${apiName} = createApi({
  reducerPath: '${apiName}',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['${moduleNameSingular}'],

  endpoints: (builder) => ({
    get${moduleNamePascal}: builder.query({
      query: ({ search, page, status, date, limit }) => {
        const params = {
          keyword: search,
          status,
          page: page + 1,
          limit,
        };
        if (date) params.date = date;
        return {
          url: API_ROUTES.${toConstantCase(moduleName)},
          method: 'GET',
          params,
        };
      },
      transformResponse: (res) => ({
        data: res.data,
        meta: res.meta,
      }),
      providesTags: ['${moduleNameSingular}'],
    }),

    add${moduleNameSingularPascal}: builder.mutation({
      query: (new${moduleNameSingularPascal}) => ({
        url: API_ROUTES.${toConstantCase(moduleName)},
        method: 'POST',
        body: new${moduleNameSingularPascal},
      }),
      invalidatesTags: ['${moduleNameSingular}'],
    }),

    update${moduleNameSingularPascal}: builder.mutation({
      query: ({ id, ...updated${moduleNameSingularPascal} }) => ({
        url: API_ROUTES.${toConstantCase(moduleName)}_BY_ID(id),
        method: 'PUT',
        body: updated${moduleNameSingularPascal},
      }),
      invalidatesTags: ['${moduleNameSingular}'],
    }),

    delete${moduleNameSingularPascal}: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.${toConstantCase(moduleName)}_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['${moduleNameSingular}'],
    }),
  }),
});

export const {
  useGet${moduleNamePascal}Query,
  useAdd${moduleNameSingularPascal}Mutation,
  useUpdate${moduleNameSingularPascal}Mutation,
  useDelete${moduleNameSingularPascal}Mutation,
} = ${apiName};
`;

  const outputDir = path.join(process.cwd(), 'src', 'store', 'Reducer');
  const outputFile = path.join(outputDir, `${fileName}-api.js`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}`);
  }

  if (fs.existsSync(outputFile)) {
    console.error(`❌ Error: File already exists at ${outputFile}`);
    console.log('Please delete it or use a different module name.');
    process.exit(1);
  }

  fs.writeFileSync(outputFile, fileContent, 'utf8');
  console.log(`✅ Successfully generated: ${outputFile}`);

  updateStoreFile(apiName, fileName);
}

/**
 * Update store.js file automatically
 */
function updateStoreFile(apiName, fileName) {
  const storeFilePath = path.join(process.cwd(), 'src', 'store', 'store.js');

  if (!fs.existsSync(storeFilePath)) {
    console.error('❌ store.js not found at', storeFilePath);
    return;
  }

  let storeContent = fs.readFileSync(storeFilePath, 'utf8');
  const importStatement = `import { ${apiName} } from './Reducer/${fileName}-api';\n`;

  // ✅ 1. Add import at the end of all import statements
  if (!storeContent.includes(importStatement.trim())) {
    const importRegex = /import .* from .*\n/g;
    const matches = [...storeContent.matchAll(importRegex)];
    const lastImport = matches[matches.length - 1];

    if (lastImport) {
      const insertPosition = lastImport.index + lastImport[0].length;
      storeContent =
        storeContent.slice(0, insertPosition) +
        importStatement +
        storeContent.slice(insertPosition);
      console.log('✅ Added import to store.js (after all imports)');
    } else {
      storeContent = importStatement + storeContent;
      console.log('⚠️ No imports found — placed at top');
    }
  } else {
    console.log('⚠️ Import already exists in store.js');
  }

  // ✅ 2. Add reducer cleanly (no extra blank line)
  const reducerPattern = /reducer:\s*\{([\s\S]*?)\},/m;
  if (reducerPattern.test(storeContent)) {
    storeContent = storeContent.replace(reducerPattern, (match, inner) => {
      if (inner.includes(`[${apiName}.reducerPath]`)) return match;
      const newReducer = `[${apiName}.reducerPath]: ${apiName}.reducer,\n    ${inner.trimStart()}`;
      return `reducer: {\n    ${newReducer}\n  },`;
    });
    console.log('✅ Added reducer to store.js (no extra line)');
  }

  // ✅ 3. Add middleware
  const middlewarePattern = /concat\(([\s\S]*?)\)/m;
  if (middlewarePattern.test(storeContent)) {
    storeContent = storeContent.replace(middlewarePattern, (match, inner) => {
      if (inner.includes(`${apiName}.middleware`)) return match;
      return `concat(${inner.trim()}, ${apiName}.middleware)`;
    });
    console.log('✅ Added middleware to store.js');
  }

  fs.writeFileSync(storeFilePath, storeContent, 'utf8');
  console.log(`🎉 store.js successfully updated with ${apiName}`);
}

// 🔤 Helpers
const toCamelCase = (str) =>
  str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) =>
      i === 0 ? w.toLowerCase() : w.toUpperCase()
    )
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '');

const toPascalCase = (str) =>
  str.replace(/(?:^\w|[A-Z]|\b\w)/g, (w) => w.toUpperCase()).replace(/\s+/g, '').replace(/[-_]/g, '');

const toConstantCase = (str) =>
  str.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[\s-]/g, '_').toUpperCase();

const toKebabCase = (str) =>
  str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]/g, '-').toLowerCase();

const removePlural = (str) => {
  if (str.endsWith('ies')) return `${str.slice(0, -3)}y`;
  if (str.endsWith('ses') || str.endsWith('ches') || str.endsWith('xes'))
    return str.slice(0, -2);
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
};

// 🏁 Run script
generateRTKFile(process.argv[2]);
