type ButtonCallback = () => void;

interface IActionFormButton {
	/**
	 * Text that gets displayed on the button
	 */
	text: string;
	/**
	 * The icon that is showed with this button
	 */
	iconPath?: string | null;
	/**
	 * What gets called when this gets clicked
	 */
	callback?: ButtonCallback;
}

interface IMessageFormButton {
	/**
	 * Text that gets displayed on the button
	 */
	text: string;
	/**
	 * What gets called when this gets clicked
	 */
	callback?: ButtonCallback;
}

interface IModalFormArg {
	/**
	 * What this form arg is
	 */
	type: "dropdown" | "slider" | "textField" | "toggle";
	/**
	 * if this option is a dropdown this is
	 * the Values that this dropdown can have
	 */
	options?: string[];
}

type AppendFormField<Base, Next> = Base extends (...args: infer E) => infer R
	? (...args: [...E, Next]) => R
	: never;
