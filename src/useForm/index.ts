import { toMerged } from "es-toolkit";
import { useState } from "react";
import type { PartialDeep } from "type-fest";
import type { z } from "zod";

export const useForm = <T extends z.ZodObject>(args: {
	schema: T;
	initialValues: z.infer<T>;
}) => {
	const [formState, _setFormState] = useState(args.initialValues);
	const setFormState = (patches: PartialDeep<typeof formState>) => {
		_setFormState((previous) => toMerged(previous, patches));
	};
	const setValues = (patches: Partial<typeof formState>) => {
		_setFormState((previous) => ({ ...previous, ...patches }));
	};

	const [hasSubmitted, setHasSubmitted] = useState(false);
	const submit = (f: () => void) => {
		return (e?: any) => {
			if (e instanceof Event) {
				e.preventDefault();
			}

			f();
			setHasSubmitted(true);
		};
	};

	const getErrors = () => {
		if (hasSubmitted) {
			const parsed = hasSubmitted
				? args.schema.safeParse(formState)
				: undefined;

			if (parsed && !parsed.success) {
				return Object.fromEntries(
					parsed.error.issues.map(({ path, message }) => {
						return [
							path.map((a) => (typeof a === "number" ? `[${a}]` : a)).join("."),
							message
						];
					})
				);
			}

			return undefined;
		}

		return undefined;
	};
	const errors = getErrors();
	const getError = (key: string) => {
		return errors ? errors[key] : undefined;
	};

	const valid = errors === undefined;

	return {
		formState,
		getError,
		setFormState,
		setValues,
		submit,
		valid
	};
};
