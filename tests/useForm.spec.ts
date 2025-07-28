import { describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";
import { useForm } from "../src";

const schema = z.object({
	id: z.string().max(5, "Invalid id"),
	others: z
		.object({
			a: z.string().max(5, "Invalid others.a"),
			b: z.string().max(5, "Invalid others.b"),
			c: z.array(z.string().nonempty("Invalid others.c"))
		})
		.check((ctx) => {
			if (ctx.value.a.length + ctx.value.b.length > 9) {
				ctx.issues.push({
					code: "custom",
					input: ctx.value,
					message: "a.length + ctx.value.b.length > 9",
					path: []
				});
			}
		}),
	password: z.string().max(5, "Invalid password"),
	username: z.string().max(5, "Invalid username")
});

describe("createOnSubmit, getError, and valid", () => {
	it("No erros", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.createOnSubmit(() => {})();
		});

		expect(result.current.valid).toBe(true);
		expect(result.current.formState).toStrictEqual({
			id: "",
			others: {
				a: "",
				b: "",
				c: ["c"]
			},
			password: "",
			username: ""
		});
	});

	it("Invalid values before submitting a form", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "123456",
					username: "123456"
				},
				schema
			})
		);

		expect(result.current.valid).toBe(true);
	});

	it("Invalid values after submitting a form", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "123456",
					username: "123456"
				},
				schema
			})
		);

		act(() => {
			result.current.createOnSubmit(() => {})();
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("id")).toBeUndefined();
		expect(result.current.getError("others")).toBeUndefined();
		expect(result.current.getError("password")).toBe("Invalid password");
		expect(result.current.getError("username")).toBe("Invalid username");
	});

	it("In a valid form, an argument of submit is true", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		let submitValid: boolean | undefined;

		act(() => {
			result.current.createOnSubmit((nextValid) => {
				submitValid = nextValid;
			})();
		});

		expect(submitValid).toBe(true);
	});

	it("In an invalid form, an argument of submit is false", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "123456",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		let submitValid: boolean | undefined;

		act(() => {
			result.current.createOnSubmit((nextValid) => {
				submitValid = nextValid;
			})();
		});

		expect(submitValid).toBe(false);
	});

	it("Invalid a child of a nested value", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "123456",
						b: "",
						c: [""]
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.createOnSubmit(() => {})();
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("id")).toBeUndefined();
		expect(result.current.getError("others")).toBeUndefined();
		expect(result.current.getError("others.a")).toBe("Invalid others.a");
		expect(result.current.getError("others.c.0")).toBe("Invalid others.c");
		expect(result.current.getError("password")).toBeUndefined();
		expect(result.current.getError("username")).toBeUndefined();
	});

	it("Invalid a nested value itself", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "12345",
						b: "12345",
						c: ["c"]
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.createOnSubmit(() => {})();
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("id")).toBeUndefined();
		expect(result.current.getError("others")).toBe(
			"a.length + ctx.value.b.length > 9"
		);
		expect(result.current.getError("password")).toBeUndefined();
		expect(result.current.getError("username")).toBeUndefined();
	});
});

describe("setImmediatelyValidatedKey", () => {
	it("Before submitting a form", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "123456",
					username: "123456"
				},
				schema
			})
		);

		act(() => {
			result.current.setImmediatelyValidatedKey("password");
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("id")).toBeUndefined();
		expect(result.current.getError("others")).toBeUndefined();
		expect(result.current.getError("password")).toBe("Invalid password");
		expect(result.current.getError("username")).toBeUndefined();

		act(() => {
			result.current.setImmediatelyValidatedKey("password", false);
		});

		expect(result.current.valid).toBe(true);
		expect(result.current.getError("id")).toBeUndefined();
		expect(result.current.getError("others")).toBeUndefined();
		expect(result.current.getError("password")).toBeUndefined();
		expect(result.current.getError("username")).toBeUndefined();
	});

	it("After submitting a form", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "123456",
					username: "123456"
				},
				schema
			})
		);

		act(() => {
			result.current.createOnSubmit(() => {})();
			result.current.setImmediatelyValidatedKey("password");
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("id")).toBeUndefined();
		expect(result.current.getError("others")).toBeUndefined();
		expect(result.current.getError("password")).toBe("Invalid password");
		expect(result.current.getError("username")).toBe("Invalid username");
	});
});

describe("Setter", () => {
	it("setFormState", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.setFormState({ others: { a: "a" } });
		});

		expect(result.current.formState).toStrictEqual({
			id: "",
			others: {
				a: "a",
				b: "",
				c: ["c"]
			},
			password: "",
			username: ""
		});
	});

	it("setValues", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: "",
						c: ["c"]
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.setValues({
				others: {
					a: "a",
					b: "b",
					c: ["c"]
				}
			});
		});

		expect(result.current.formState).toStrictEqual({
			id: "",
			others: {
				a: "a",
				b: "b",
				c: ["c"]
			},
			password: "",
			username: ""
		});
	});
});
