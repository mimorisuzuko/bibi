import { describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";
import { useForm } from "../src";

const schema = z.object({
	id: z.string().max(5, "Invalid id"),
	others: z
		.object({
			a: z.string().max(5, "Invalid others.a"),
			b: z.string().max(5, "Invalid others.b")
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

describe("submit, valid, and getError", () => {
	it("No erros", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: ""
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.submit(() => {})();
		});

		expect(result.current.valid).toBe(true);
	});

	it("Invalid values before submitting", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: ""
					},
					password: "123456",
					username: "123456"
				},
				schema
			})
		);

		expect(result.current.valid).toBe(true);
	});

	it("Invalid values after submitting", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: ""
					},
					password: "123456",
					username: "123456"
				},
				schema
			})
		);

		act(() => {
			result.current.submit(() => {})();
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
						b: ""
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		let submitValid: boolean | undefined;

		act(() => {
			result.current.submit((nextValid) => {
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
						b: ""
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		let submitValid: boolean | undefined;

		act(() => {
			result.current.submit((nextValid) => {
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
						b: ""
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.submit(() => {})();
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("id")).toBeUndefined();
		expect(result.current.getError("others")).toBeUndefined();
		expect(result.current.getError("others.a")).toBe("Invalid others.a");
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
						b: "12345"
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.submit(() => {})();
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

describe("Setter", () => {
	it("setFormState", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					id: "",
					others: {
						a: "",
						b: ""
					},
					password: "",
					username: ""
				},
				schema
			})
		);

		act(() => {
			result.current.setFormState({ password: "1" });
		});

		expect(result.current.formState).toStrictEqual({
			id: "",
			others: {
				a: "",
				b: ""
			},
			password: "1",
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
						b: ""
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
					b: "b"
				}
			});
		});

		expect(result.current.formState).toStrictEqual({
			id: "",
			others: {
				a: "a",
				b: "b"
			},
			password: "",
			username: ""
		});
	});
});
