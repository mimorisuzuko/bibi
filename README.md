# `@mimorisuzuko/bibi`

A state-based form hook. This package name is inspired by [Murakawa Bibian](https://x.com/bibian_ct1203).

## APIs

```tsx
import type { z } from "zod";

const schema = z.object({ ... });

const {
    createOnSubmit,
    formState,
	getError,
	setFormState,
	setValues,
	valid
} = useForm({ schema: { ... }, initialValues: { ... } });
```

### `formState`

Return the current state.

### `getError`

Get an error by `getError(path: string)` after calling the `createOnSubmit`.

### `setFormState`

Deeply merge the `formState`.

### `setValues`

Set the values the `formState`.

### `createOnSubmit`

```tsx
<form onSubmit={createOnSubmit((valid) => {
    if (valid) {
        // The `formState` matches the `schema`
    } else {
        // The `formState` does not matches it.
    }
})}>
    {...}
</form>
```

### `valid`

Return `true` if the `createOnSubmit` has not been called or the form has no errors after calling the `createOnSubmit`.
