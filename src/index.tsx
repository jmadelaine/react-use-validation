import { useState, useCallback, useEffect, useRef, Dispatch, SetStateAction } from 'react'
import deepEqual from 'deep-equal'

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

  const validateRule = useCallback(
    <TRuleKey extends keyof TRules>(
      ruleKey: TRuleKey,
      rule: (state: TRules[TRuleKey]) => boolean,
      state: TRules[TRuleKey],
      setResultsCallback?: Dispatch<SetStateAction<Record<keyof TRules, boolean | undefined>>>
    ) => {
      if (!rule) {
        return undefined
      }
      const isValid = Boolean(rule(state))
      if (setResultsCallback) {
        setResultsCallback(prev => {
          if (prev[ruleKey] === isValid) {
            return prev
          } else {
            return { ...prev, [ruleKey]: isValid }
          }
        })
      }
      return isValid
    },
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

  const rulesRef = useRef(rules)
  useEffect(() => {
    rulesRef.current = rules
  }, [rules, rulesRef])

  const validate = useCallback(
    <TRuleKey extends keyof TRules>(ruleKey?: TRuleKey, state?: TRules[TRuleKey][0]) => {
      if (ruleKey !== undefined) {
        return validateRule(
          ruleKey,
          rulesRef.current[ruleKey][1],
          state === undefined ? rulesRef.current[ruleKey][0] : state,
          setResults
        )
      } else {
        return Object.keys(rulesRef.current)
          .map(k => validateRule(k, rulesRef.current[k][1], rulesRef.current[k][0], setResults))
          .every(Boolean)
      }
    },
    [rulesRef, validateRule]
  )

  const memoizedRuleDepsRef = useRef<
    | {
        [K in keyof TRules]: TRules[K][0]
      }
    | undefined
  >(undefined)

  useEffect(() => {
    const newDeps = Object.keys(rules).reduce(
      (a, k) => ({ ...a, [k]: rules[k][0] }),
      {} as {
        [K in keyof TRules]: TRules[K][0]
      }
    )

    if (memoizedRuleDepsRef.current === undefined) {
      memoizedRuleDepsRef.current = newDeps
    } else {
      const rulesWithChangedDeps = Object.keys(newDeps)
        .map(k => !deepEqual(memoizedRuleDepsRef.current![k], newDeps[k], { strict: true }) && k)
        .filter(Boolean) as (keyof TRules)[]

      if (rulesWithChangedDeps.length) {
        memoizedRuleDepsRef.current = newDeps
      }

      if (optionsInternal.validateOnChange) {
        rulesWithChangedDeps.forEach(k => validate(k, newDeps[k]))
      }
    }
    /*
     * Deliberately not including optionsInternal, results, validate, and
     * memoizedRuleDepsRef as dependencies, as we only want this effect
     * to run when rule deps change. Once rule deps change, other dependencies
     * will be up-to-date.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...Object.values(rules).map(v => v[0])])

  return {
    invalid: Object.keys(results).reduce((res, k: keyof TRules) => {
      res[k] = results[k] === false
      return res
    }, {} as Record<keyof TRules, boolean>),
    valid: Object.keys(results).reduce((res, k: keyof TRules) => {
      res[k] = results[k] === true
      return res
    }, {} as Record<keyof TRules, boolean>),
    validate,
  }
}

export default useValidation
