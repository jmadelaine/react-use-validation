[![Unlicense License][license-badge]][license]
[![NPM version][npm-badge]][npm]

# react-use-validation

Wouldn't it be great if there was a way to validate form fields without having to delegate control of form state to a third party library?

`react-use-validation` is a non-intrusive validation hook for React.

### Non-intrusive?

This hook is **not** a form state library.

- No need to attach refs to input components or bloat JSX with validation logic.

- No need to wonder what third party libraries are doing behind the scenes.

- No need to learn complex APIs that re-invent state management.

`react-use-validation` validates state values, then _you_ decide what to do with the results.

### Not just for forms

Although validating form inputs is a common use-case, there are many other places in an app where validation is necessary.

`react-use-validation` is a simple state validator. Pass it some state, tell it how to validate that state, and let it tell you whenever the validity of that state changes.

### Quick start

```jsx
const [str, setStr] = React.useState('')

const validation = useValidation(
  {
    // rule_name: [state_to_validate, function_that_returns_true_or_false]
    myValidationRule: [str, s => Boolean(s.length)],
  },
  {
    // Automatic validation when state changes
    validateOnChange: true,
  }
)

return (
  <div>
    <input value={str} onChange={e => setStr(e.target.value)} />
    {/* Render a hint if validation fails */}
    {validation.invalid.myValidationRule && <div>{'Woops'}</div>}
  </div>
)
```

## Installation

```
npm install --save react-use-validation
```

> This package depends on `react` (v16.8.0 or later).

## Usage

### Import

Import the hook in a component file:

```jsx
import useValidation from 'react-use-validation'
```

### Rules

Pass a `rules` object to the hook. Each property of this object defines a single validation rule:

```jsx
const rules = {
  ruleName: [state, validationFunction],
}

const validation = useValidation(rules)
```

The property key defines the rule name, and the value is an array that contains two elements:

- The first element is the **state** being validated.
- The second element is a **function** that receives this state, and returns a boolean, `true` for succesful validation or `false` for failed validation.

### Validate

Call the `validate` function to run a validation.

### Results

Access validation results via the `valid` and `invalid` objects returned from the hook. Results are keyed by rule name.

For a rule `myRule`, if `valid.myRule` is `true` then the rule has passed validation, if `invalid.myRule` is `true` then the rule has failed validation, if neither are `true` then the rule has not yet been validated (see [`options.validateOnInit`](###validateOnInit) for an explanation on why validation may not have been run for some rules).

## Examples

### Input validation

Validating a single input is as easy as defining a validation rule, calling `validate` in `onChange`, and rendering a hint if that rule fails:

```jsx
// State
const [name, setName] = React.useState('')

const validation = useValidation({
  // Rule only passes if user has entered a name
  nameEntered: [name, n => Boolean(n.length)],
})

return (
  <div>
    <label>{'Name'}</label>
    <input
      value={name}
      onChange={e => {
        // Validate the new name value
        validation.validate('nameEntered', e.target.value)
        setName(e.target.value)
      }}
    />
    {validation.invalid.nameEntered && <div>{'Enter a name'}</div>}
  </div>
)
```

`react-use-validation` provides a `validate` function which is used to trigger validation. To validate a rule, call `validate`, passing in the rule name. Alternatively, `react-use-validation` can be configured to automatically revalidate on state change (see [Automatic validation](##Automatic-validation)).

### Form validation

The real power of `react-use-validation` comes from the ability to define multiple rules, and validate them all at once.

In a form where several fields require validation, we want to validate fields individually as their input values change, but validate all fields together before submission.

Calling `validate` without any arguments will validate all rules.

`validate` returns a boolean `true` for successful validation, or `false` for failed validation.

To validate a form before submitting, call `validate` inside your `onSubmit` function, or check the `valid` results object has a `true` value for all rules (note that calling `validate` is preferred as it will also run validation):

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

  // Alternatively, check that each rule is marked as valid
  // const isFormValid = Object.values(validation.valid).every(Boolean)

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
          validation.validate('nameEntered', e.target.value)
          setName(e.target.value)
        }}
      />
      {validation.invalid.nameEntered && <div>{'Enter a name'}</div>}
    </div>
    <div>
      <label>{'Email'}</label>
      <input
        value={email}
        onChange={e => {
          validation.validate('emailShape', e.target.value)
          setEmail(e.target.value)
        }}
      />
      {validation.invalid.emailShape && <div>{'Enter a valid email'}</div>}
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
      {validation.invalid.passwordComplexity && (
        <div>{'Password must be at least 8 characters'}</div>
      )}
    </div>
    <div>
      <label>{'Confirm Password'}</label>
      <input
        value={confirmPassword}
        onChange={e => {
          validation.validate('passwordMatch', { p: password, cp: e.target.value })
          setConfirmPassword(e.target.value)
        }}
      />
      {validation.invalid.passwordMatch && <div>{'Password does not match'}</div>}
    </div>
  </div>
)
```

### Automatic validation

By default, validation only happens when you call `validate`. For convenience, you can automatically revalidate every time state values change by setting the configuration option [`validateOnChange`](###validateOnChange) to `true`:

```jsx
const options = {
  validateOnChange: true,
}

const validation = useValidation(rules, options)
```

Now a rule will revalidate every time one of its state values change.

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
    {validation.invalid.nameEntered && <div>{'Enter a name'}</div>}
  </div>
)
```

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

The common use-case for `react-use-validation` is validating form inputs. As most input values are invalid (empty) when a form is first rendered, it would not be ideal to validate all inputs on initial render, as there would likely be a bunch of errors on the screen.

To make things easier, a validation rule does not run until its state values change.

Understandably, this means that on initialization, validation results are not representative of state. An initial state value may be valid, but is not marked as `true` in either of the `valid` or `invalid` result objects, because validation has not yet happened.

If you prefer to always have validation results in sync with state, you can run validation on initialization by setting `validateOnInit` to `true`.

### validateOnChange

> Defaults to `false`

By default, validation only happens when you call `validate`. For convenience, you can automatically revalidate every time state values change by setting `validateOnChange` to `true`.

> State change is detected through deep value equality, not referential equality, so validation will not run unnecessarily when you pass a new object with the same state values.

[license-badge]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license]: LICENSE.md
[npm-badge]: https://badge.fury.io/js/react-use-validation.svg
[npm]: https://npmjs.org/package/react-use-validation
