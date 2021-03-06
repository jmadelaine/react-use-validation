[![Unlicense license][license-badge]][license]
[![NPM version][npm-badge]][npm]

# react-use-validation

Wouldn't it be great if there was a way to validate form fields without delegating control of form state to a third party library?

`react-use-validation` is a non-intrusive validation hook for React.

### Non-intrusive?

This hook is **not** a form state library.

There's no need to attach refs or spread props on input components, learn complex state management APIs, or bloat JSX with validation configuration.

### Quick start

- Define some state.
- Define a validation rule with a **ruleName**, some **state** to validate, and a **validation function** that takes that state and returns `true` (valid) or `false` (invalid).
- Run validation whenever you like (or see the [automatic validation example](#Automatic-validation)).
- Render a hint for the user if validation fails.
- Before submitting, run validation against all rules.

```jsx
// Define some state
const [str, setStr] = React.useState('')

const validation = useValidation({
  // Define a validation rule
  // rule_name: [state_to_validate, function_that_returns_true_or_false]
  myValidationRule: [str, s => Boolean(s.length)],
})

const onSubmit = () => {
  // Before submitting, run validation against all rules
  if (validation.validate()) {
    // Submit here...
  }
}

return (
  <form onSubmit={onSubmit}>
    <input
      value={str}
      onChange={e => {
        // Validate a specific rule, passing an up-to-date state value
        validation.validate('myValidationRule', e.target.value)
        setStr(e.target.value)
      }}
    />
    {/* Render a hint if validation fails for a specific rule */}
    {validation.isInvalid('myValidationRule') && <div>{'Please enter something'}</div>}
  </form>
)
```

## Installation

```
npm i react-use-validation
```

> This package depends on `react` (v16.8.0 or later).

## Usage

### Import

Import the hook in a component file:

```jsx
import useValidation from 'react-use-validation'
```

### Define rules

Pass a `rules` object to the hook. Each property of this object defines a single validation rule:

```jsx
const rules = {
  ruleName: [stateToValidate, validationFunction],
}

const validation = useValidation(rules)
```

The property key is the rule name. This key is used to run validation for a specific rule and access validation results.

A rule is defined as an array containing two elements:

1. The **state** to validate.
2. A **function** that receives this state, and returns a boolean (`true` for succesful validation or `false` for failed validation).

### Validate

The hook returns a [`validate`](#validate) function that can be used to run validation.

Validation can be triggered in several ways:

- Calling `validate()` (with _no arguments_) will run validation against all rules using current state.
- Calling `validate('ruleName')` (passing a _rule name_) will run validation against the specified rule using current state.
- Calling `validate('ruleName', state)` (passing both a _rule name_ and _state_) will run validation against the specified rule using the passed state.

Alternatively, see [automatic validation](#Automatic-validation).

### Inspect results

The hook returns an [`isValid`](#isValid) function and an [`isInvalid`](#isInvalid) function that can be used to get validation results.

For a rule "myRule":

- If `isValid('myRule') === true` the rule is valid.
- If `isInvalid('myRule') === true` the rule is invalid.
- If `isValid('myRule') === false && isInvalid('myRule') === false` the rule has not yet been validated.

For an explanation as to why results are defined in this way, see "[Why two result functions?](#Why-two-result-function?)".

## Configuration

`react-use-validation` can be configured by passing an `options` object as the second argument:

```jsx
const validation = useValidation(rules, options)
```

Default configuration is as follows:

```jsx
{
  validateOnInit: false,
  validateOnChange: false,
}
```

### validateOnInit

> Defaults to `false`

By default, `react-use-validation` does not validate on initialization (see "[Why not validate on initial render?](#Why-not-validate-on-initial-render?)").

To validate on initialization, set `validateOnInit` to `true`.

### validateOnChange

> Defaults to `false`

By default, validation is only triggered by calling the `validate` function.

For convenience, you can set rules to automatically validate every time their state values change by setting `validateOnChange` to `true`.

> State change is detected through strict deep value equality (not referential equality).

## API

`react-use-validation` returns an object with the following members:

### isValid

A function that accepts an optional rule name `string` and returns a `boolean` that determines if the rule/rules are valid. If a rule name is provided, only the specified rule will be checked. If no rule name is provided, all rules will be checked.

Executing this function does not run validation.

```typescript
const isValid: <TRuleKey extends keyof TRules>(ruleKey?: TRuleKey | undefined) => boolean
```

### isInvalid

A function that accepts an optional rule name `string` and returns a `boolean` that determines if the rule/rules are invalid. If a rule name is provided, only the specified rule will be checked. If no rule name is provided, all rules will be checked.

Executing this function does not run validation.

```typescript
const isInvalid: <TRuleKey extends keyof TRules>(ruleKey?: TRuleKey | undefined) => boolean
```

### validate

A function that accepts an optional rule name `string` and an optional value to validate the rule against, and returns a `boolean` that determines if the rule/rules are valid (`true`) or invalid (`false`). If a rule name is provided, only the specified rule will be validated. If a value is provided, the specified rule will be validated using the supplied value. If no rule name is provided, all rules will be validated using current state values.

Executing this function runs validation and may update state.

```typescript
const validate: <TRuleKey extends keyof TRules>(
  ruleKey?: TRuleKey | undefined,
  state?: TRules[TRuleKey][0] | undefined
) => boolean
```

## FAQs

### Why not validate on initial render?

The most common use-case for validation is validating form input values. Most input values are invalid (empty) by default, so validating everything on initial render means a user sees error messages before they do anything.

To make `react-use-validation` easier to work with, a **validation rule does not run until its state value changes from the initial value**.

You can configure this with [`options.validateOnInit`](#validateOnInit).

### Why two result functions?

As validation does not happen on initialization by default (see "[Why not validate on initial render?](#Why-not-validate-on-initial-render?)"), a rule can be in one of three states: **valid**, **invalid**, or **unvalidated**.

The most common use-case for reading validation results is to render an error message or user hint. If a result had three possible values (`true`, `false`, or `undefined`) you would need to differentiate between `false` and `undefined` when rendering the error:

```jsx
// Strict equality check is required
validation.getResult('nameEntered') === false && <div>{'Enter a name'}</div>
```

Instead, with the current implementation we can write:

```jsx
validation.isInvalid('nameEntered') && <div>{'Enter a name'}</div>
```

The first example is more verbose, and may lead into the trap of writing `!validation.getResult('nameEntered')` which would incorrectly render an error if validation had not run (validation result of `undefined`).

The current implementation is more declarative, shorter, and easier to read.

## Examples

### Input validation

Validating a single input is as easy as defining a validation rule, validating when state changes, and showing a hint if validation fails:

```jsx
const [name, setName] = React.useState('')

const validation = useValidation({
  // Rule only passes if name has been entered
  nameEntered: [name, n => Boolean(n.length)],
})

return (
  <div>
    <label>{'Name'}</label>
    <input
      value={name}
      onChange={e => {
        // Validate using an up-to-date state value
        validation.validate('nameEntered', e.target.value)
        setName(e.target.value)
      }}
    />
    {validation.isInvalid('nameEntered') && <div>{'Enter a name'}</div>}
  </div>
)
```

### Form validation

In a form where several fields require validation, we want to validate fields individually as their values change, and then validate all fields at once before submitting.

`validate` returns a boolean `true` for successful validation, or `false` for failed validation.

Call `validate` inside your `onSubmit` function, or call the `isValid` function or `validate` function (note that calling `validate` is preferred as this also triggers validation):

```jsx
const [name, setName] = React.useState('')
const [email, setEmail] = React.useState('')

const validation = useValidation({
  nameEntered: [name, n => Boolean(n.length)],
  emailShape: [email, e => /.+@.+\..+/.test(e)],
})

const onSubmit = e => {
  e.preventDefault()

  // Validate all rules before submitting
  const isFormValid = validation.validate()

  // Alternatively, check that all rules are marked as valid
  // const isFormValid = validation.isValid()

  if (isFormValid) {
    // Submit form here...
  }
}

return (
  <form onSubmit={onSubmit}>
    <div>
      <label>{'Name'}</label>
      <input
        value={name}
        onChange={e => {
          // Validate name on change
          validation.validate('nameEntered', e.target.value)
          setName(e.target.value)
        }}
      />
      {validation.isInvalid('nameEntered') && <div>{'Enter a name'}</div>}
    </div>
    <div>
      <label>{'Email'}</label>
      <input
        value={email}
        onChange={e => {
          // Validate email on change
          validation.validate('emailShape', e.target.value)
          setEmail(e.target.value)
        }}
      />
      {validation.isInvalid('emailShape') && <div>{'Enter a valid email'}</div>}
    </div>
    <button>Submit</button>
  </form>
)
```

### Complex state validation

Sometimes a single rule needs to listen to multiple state values. In this case, pass both values to the rule as either an object or an array:

```jsx
const [password, setPassword] = React.useState('')
const [confirmPassword, setConfirmPassword] = React.useState('')

const validation = useValidation({
  passwordComplexity: [password, p => p.length > 7],
  // Pass an object containing both state values
  passwordMatch: [{ p: password, cp: confirmPassword }, ({ p, cp }) => p === cp],
  // An array also works
  // passwordMatches: [[password, confirmPassword], ([p, cp]) => p === cp],
})

return (
  <div>
    <div>
      <label>{'Password'}</label>
      <input
        value={password}
        onChange={e => {
          validation.validate('passwordComplexity', e.target.value)
          setPassword(e.target.value)
        }}
      />
      {validation.isInvalid('passwordComplexity') && (
        <div>{'Password must be at least 8 characters'}</div>
      )}
    </div>
    <div>
      <label>{'Confirm Password'}</label>
      <input
        value={confirmPassword}
        onChange={e => {
          // Make sure to pass the correct state object shape
          validation.validate('passwordMatch', { p: password, cp: e.target.value })
          setConfirmPassword(e.target.value)
        }}
      />
      {validation.isInvalid('passwordMatch') && <div>{'Password does not match'}</div>}
    </div>
  </div>
)
```

### Automatic validation

With automatic validation, there's no need to call `validate` in the `onChange` function (when validating prior to form submission, `validate` should still be called).

```jsx
const [name, setName] = React.useState('')

const validation = useValidation(
  {
    nameEntered: [name, n => Boolean(n.length)],
  },
  {
    // Automatic validation when state changes
    validateOnChange: true,
  }
)

return (
  <div>
    <label>{'Name'}</label>
    <input
      value={name}
      // No need to call validate here
      onChange={e => setName(e.target.value)}
    />
    {validation.isInvalid('nameEntered') && <div>{'Enter a name'}</div>}
  </div>
)
```

[license-badge]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license]: LICENSE.md
[npm-badge]: https://badge.fury.io/js/react-use-validation.svg
[npm]: https://npmjs.org/package/react-use-validation
