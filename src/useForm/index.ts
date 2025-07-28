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

	const [immediatelyValidatedKeys, setImmediatelyValidatedKeys] = useState<
		string[]
	>([]);
	const setImmediatelyValidatedKey = (key: string, push = true) => {
		const index = immediatelyValidatedKeys.indexOf(key);

		if (push && index === -1) {
			setImmediatelyValidatedKeys((previous) => [...previous, key]);
		} else if (!push && index >= -1) {
			setImmediatelyValidatedKeys(immediatelyValidatedKeys.toSpliced(index, 1));
		}
	};

	const getErrors = (specifiedKeys?: string[]) => {
		const parsed = args.schema.safeParse(formState);

		if (parsed && !parsed.success) {
			const entries: [key: string, message: string][] = [];

			for (const { path, message } of parsed.error.issues) {
				const key = path.join(".");

				if (specifiedKeys === undefined || specifiedKeys.includes(key)) {
					entries.push([path.join("."), message]);
				}
			}

			return entries.length === 0 ? undefined : Object.fromEntries(entries);
		}

		return undefined;
	};

	const [hasSubmitted, setHasSubmitted] = useState(false);
	const createOnSubmit = (f: (valid: boolean) => void) => {
		return (e?: any) => {
			if (e instanceof Event) {
				e.preventDefault();
			}

			f(getErrors() === undefined);
			setHasSubmitted(true);
		};
	};
	const errors = hasSubmitted
		? getErrors()
		: getErrors(immediatelyValidatedKeys);
	const getError = (key: string) => {
		return errors ? errors[key] : undefined;
	};

	const valid = errors === undefined;

	return {
		createOnSubmit,
		formState,
		getError,
		setFormState,
		setImmediatelyValidatedKey,
		setValues,
		valid
	};
};
