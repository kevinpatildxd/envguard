import { ParsedEnv, ValidationResult } from './types';
import { missingKey } from './rules/missing-key';
import { emptyValue } from './rules/empty-value';
import { undeclaredKey } from './rules/undeclared-key';
import { insecureDefaults } from './rules/insecure-defaults';
import { weakSecret } from './rules/weak-secret';
import { typeMismatch } from './rules/type-mismatch';
import { malformedUrl } from './rules/malformed-url';
import { booleanMismatch } from './rules/boolean-mismatch';

export function validate(env: ParsedEnv, example: ParsedEnv): ValidationResult[] {
  return [
    ...missingKey(env, example),
    ...emptyValue(env, example),
    ...undeclaredKey(env, example),
    ...insecureDefaults(env, example),
    ...weakSecret(env, example),
    ...typeMismatch(env, example),
    ...malformedUrl(env, example),
    ...booleanMismatch(env, example),
  ];
}
