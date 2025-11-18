// ESLint 평면 구성 파일 (v9 이상)
// 브라우저 환경 및 전역 심볼(예: SkillManager)을 정의하고,
// 중복 선언/미정의 식별 등 기본 규칙을 설정합니다.

export default [
  // 무시 대상 설정
  {
    ignores: [
      'node_modules/**',
      'javascript/Canvas_old_backup.js'
    ]
  },
  // 자바스크립트 파일 규칙
  {
    files: ['javascript/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        Audio: 'readonly',
        Math: 'readonly',
        requestAnimationFrame: 'readonly',
        Image: 'readonly',
        SkillManager: 'readonly',
        // 타이머 관련 브라우저 전역
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-redeclare': 'error',
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-func-assign': 'error',
      'no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
      'no-unreachable': 'error',
      'eqeqeq': ['warn', 'smart'],
      'no-constant-condition': ['warn', { checkLoops: false }]
    }
  }
];
