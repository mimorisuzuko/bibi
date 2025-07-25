import { describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";
import { useForm } from "../src";

const schema = z.object({
	password: z.string().max(5, "Invalid password"),
	username: z.string().max(5, "Invalid username")
});

const nestedSchema = z.object({
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
					path: ["others"]
				});
			}
		}),
	password: z.string().max(5),
	username: z.string().max(5)
});

describe("submit, valid, and getError", () => {
	it("No erros", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: { password: "", username: "" },
				schema
			})
		);

		act(() => {
			result.current.submit(() => {});
		});

		expect(result.current.valid).toBe(true);
	});

	it("Invalid values before submitting", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: { password: "123456", username: "123456" },
				schema
			})
		);

		expect(result.current.valid).toBe(true);
		expect(result.current.getError("username")).toBeUndefined();
		expect(result.current.getError("password")).toBeUndefined();
	});

	it("Invalid values after submitting", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: { password: "123456", username: "123456" },
				schema
			})
		);

		act(() => {
			result.current.submit(() => {});
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("username")).toBe("Invalid username");
		expect(result.current.getError("password")).toBe("Invalid password");
	});
});

describe("setFormState", () => {
	it("Set a value", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: { password: "", username: "" },
				schema
			})
		);

		act(() => {
			result.current.setFormState({ password: "1" });
		});

		expect(result.current.formState).toStrictEqual({
			password: "1",
			username: ""
		});
	});

	it("Set values", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: { password: "", username: "" },
				schema
			})
		);

		act(() => {
			result.current.setFormState({ password: "1", username: "0" });
		});

		expect(result.current.formState).toStrictEqual({
			password: "1",
			username: "0"
		});
	});
});

describe("Nested values", () => {
	it("Invalid a child of a nested value", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					others: {
						a: "123456",
						b: ""
					},
					password: "",
					username: ""
				},
				schema: nestedSchema
			})
		);

		act(() => {
			result.current.submit(() => {});
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("others")).toBe("Invalid others.a");
	});

	it("Invalid a nested value itself", () => {
		const { result } = renderHook(() =>
			useForm({
				initialValues: {
					others: {
						a: "12345",
						b: "12345"
					},
					password: "",
					username: ""
				},
				schema: nestedSchema
			})
		);

		act(() => {
			result.current.submit(() => {});
		});

		expect(result.current.valid).toBe(false);
		expect(result.current.getError("others")).toBe(
			"a.length + ctx.value.b.length > 9"
		);
	});
});
