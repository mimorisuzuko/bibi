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

	const [hasSubmitted, setHasSubmitted] = useState(false);
	const submit = (f: () => void) => {
		f();
		setHasSubmitted(true);
	};

	const parsed = hasSubmitted ? args.schema.safeParse(formState) : undefined;
	const getError = (key: keyof typeof formState) => {
		if (parsed && !parsed.success) {
			return parsed.error.issues.find((a) => a.path[0] === key)?.message;
		}

		return undefined;
	};

	const valid = parsed === undefined || parsed.success;

	return { formState, getError, setFormState, submit, valid };
};
