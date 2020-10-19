import { useState, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react'
import { dequal } from 'dequal'

type RuleState = any
type Rule = [RuleState, (state: RuleState) => boolean]

type Options = {
  validateOnInit?: boolean
  validateOnChange?: boolean
}

const defaultOptions: Options = {
  validateOnInit: false,
  validateOnChange: false,
}

export const useValidation = <TRules extends Record<string, Rule>>(
  rules: TRules,
  options?: Options
) => {
  const optionsInternal = { ...defaultOptions, ...options }

  const rulesRef = useRef(rules)
  rulesRef.current = rules

  const validateRule = useCallback(
    <TRuleKey extends keyof TRules>(
      ruleKey: TRuleKey,
      rule: (state: TRules[TRuleKey][0]) => boolean,
      state: TRules[TRuleKey][0],
      setResultsCallback?: Dispatch<SetStateAction<Record<keyof TRules, boolean | undefined>>>
    ) => {
      if (!rule) {
        return false
      }
      const isValid = Boolean(rule(state))
      if (setResultsCallback) {
        setResultsCallback(prev => {
          if (prev[ruleKey] === isValid) {
            return prev
          }
          return { ...prev, [ruleKey]: isValid }
        })
      }
      return isValid
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [results, setResults] = useState<Record<keyof TRules, boolean | undefined>>(() =>
    Object.keys(rules).reduce((res, k: keyof TRules) => {
      res[k] = optionsInternal.validateOnInit
        ? validateRule(k, rules[k][1], rules[k][0])
        : undefined
      return res
    }, {} as Record<keyof TRules, boolean | undefined>)
  )

  const validate = useCallback(
    <TRuleKey extends keyof TRules>(ruleKey?: TRuleKey, state?: TRules[TRuleKey][0]) => {
      if (ruleKey === undefined) {
        return Object.keys(rulesRef.current)
          .map(k => validateRule(k, rulesRef.current[k][1], rulesRef.current[k][0], setResults))
          .every(Boolean)
      }
      return validateRule(
        ruleKey,
        rulesRef.current[ruleKey][1],
        state === undefined ? rulesRef.current[ruleKey][0] : state,
        setResults
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rulesRef, validateRule]
  )

  const memoizedRuleDepsRef = useRef<
    | {
        [K in keyof TRules]: TRules[K][0]
      }
    | undefined
  >(undefined)

  useEffect(
    () => {
      const newDeps = Object.keys(rules).reduce(
        (res, k: keyof TRules) => {
          res[k] = rules[k][0]
          return res
        },
        {} as {
          [K in keyof TRules]: TRules[K][0]
        }
      )

      if (memoizedRuleDepsRef.current === undefined) {
        memoizedRuleDepsRef.current = newDeps
      } else {
        const rulesWithChangedDeps = Object.keys(newDeps)
          .map(k => !dequal(memoizedRuleDepsRef.current![k], newDeps[k]) && k)
          .filter(Boolean) as (keyof TRules)[]

        if (rulesWithChangedDeps.length) {
          memoizedRuleDepsRef.current = newDeps
        }
        if (optionsInternal.validateOnChange) {
          rulesWithChangedDeps.forEach(k => validate(k, newDeps[k]))
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(rules).map(v => v[0])
  )

  const isValid = useCallback(
    <TRuleKey extends keyof TRules>(ruleKey?: TRuleKey) => {
      if (ruleKey === undefined) {
        return Object.values(results).every(Boolean)
      }
      return results[ruleKey] === true
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...Object.keys(results), ...Object.values(results)]
  )

  const isInvalid = useCallback(
    <TRuleKey extends keyof TRules>(ruleKey?: TRuleKey) => {
      if (ruleKey === undefined) {
        return Object.values(results).some(v => !v)
      }
      return results[ruleKey] === false
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...Object.keys(results), ...Object.values(results)]
  )

  return {
    validate,
    isValid,
    isInvalid,
  }
}

export default useValidation
