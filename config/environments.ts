export type EnvironmentName = 'dev' | 'qa' | 'uat' | 'prod';

export const ENVIRONMENTS: Record<EnvironmentName, { baseUrl: string; apiUrl: string }> = {
  dev: {
    baseUrl: process.env.BASE_URL || 'https://dev.example.com',
    apiUrl: process.env.API_BASE_URL || 'https://dev.example.com/api',
  },
  qa: {
    baseUrl: process.env.QA_BASE_URL || 'https://qa.example.com',
    apiUrl: process.env.QA_API_BASE_URL || 'https://qa.example.com/api',
  },
  uat: {
    baseUrl: process.env.UAT_BASE_URL || 'https://uat.example.com',
    apiUrl: process.env.UAT_API_BASE_URL || 'https://uat.example.com/api',
  },
  prod: {
    baseUrl: process.env.PROD_BASE_URL || 'https://example.com',
    apiUrl: process.env.PROD_API_BASE_URL || 'https://example.com/api',
  },
};

export function getEnvironment(name: EnvironmentName = 'qa') {
  return ENVIRONMENTS[name];
}
